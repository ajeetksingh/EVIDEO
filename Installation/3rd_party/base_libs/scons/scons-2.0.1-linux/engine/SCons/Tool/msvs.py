"""SCons.Tool.msvs

Tool-specific initialization for Microsoft Visual Studio project files.

There normally shouldn't be any need to import this module directly.
It will usually be imported through the generic SCons.Tool.Tool()
selection method.

"""

#
# Copyright (c) 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010 The SCons Foundation
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
# KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
# WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
# LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
# WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

__revision__ = "src/engine/SCons/Tool/msvs.py 5134 2010/08/16 23:02:40 bdeegan"

import SCons.compat

import base64
import hashlib
import ntpath
import os
# compat layer imports "cPickle" for us if it's available.
import pickle
import re
import sys

import SCons.Builder
import SCons.Node.FS
import SCons.Platform.win32
import SCons.Script.SConscript
import SCons.Util
import SCons.Warnings

from MSCommon import msvc_exists, msvc_setup_env_once
from SCons.Defaults import processDefines

##############################################################################
# Below here are the classes and functions for generation of
# DSP/DSW/SLN/VCPROJ files.
##############################################################################

def xmlify(s):
    s = s.replace("&", "&amp;") # do this first
    s = s.replace("'", "&apos;")
    s = s.replace('"', "&quot;")
    return s

external_makefile_guid = '{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}'

def _generateGUID(slnfile, name):
    """This generates a dummy GUID for the sln file to use.  It is
    based on the MD5 signatures of the sln filename plus the name of
    the project.  It basically just needs to be unique, and not
    change with each invocation."""
    m = hashlib.md5()
    # Normalize the slnfile path to a Windows path (\ separators) so
    # the generated file has a consistent GUID even if we generate
    # it on a non-Windows platform.
    m.update(ntpath.normpath(str(slnfile)) + str(name))
    solution = m.hexdigest().upper()
    # convert most of the signature to GUID form (discard the rest)
    solution = "{" + solution[:8] + "-" + solution[8:12] + "-" + solution[12:16] + "-" + solution[16:20] + "-" + solution[20:32] + "}"
    return solution

version_re = re.compile(r'(\d+\.\d+)(.*)')

def msvs_parse_version(s):
    """
    Split a Visual Studio version, which may in fact be something like
    '7.0Exp', into is version number (returned as a float) and trailing
    "suite" portion.
    """
    num, suite = version_re.match(s).groups()
    return float(num), suite

# This is how we re-invoke SCons from inside MSVS Project files.
# The problem is that we might have been invoked as either scons.bat
# or scons.py.  If we were invoked directly as scons.py, then we could
# use sys.argv[0] to find the SCons "executable," but that doesn't work
# if we were invoked as scons.bat, which uses "python -c" to execute
# things and ends up with "-c" as sys.argv[0].  Consequently, we have
# the MSVS Project file invoke SCons the same way that scons.bat does,
# which works regardless of how we were invoked.
def getExecScriptMain(env, xml=None):
    scons_home = env.get('SCONS_HOME')
    if not scons_home and 'SCONS_LIB_DIR' in os.environ:
        scons_home = os.environ['SCONS_LIB_DIR']
    if scons_home:
        exec_script_main = "from os.path import join; import sys; sys.path = [ r'%s' ] + sys.path; import SCons.Script; SCons.Script.main()" % scons_home
    else:
        version = SCons.__version__
        exec_script_main = "from os.path import join; import sys; sys.path = [ join(sys.prefix, 'Lib', 'site-packages', 'scons-%(version)s'), join(sys.prefix, 'scons-%(version)s'), join(sys.prefix, 'Lib', 'site-packages', 'scons'), join(sys.prefix, 'scons') ] + sys.path; import SCons.Script; SCons.Script.main()" % locals()
    if xml:
        exec_script_main = xmlify(exec_script_main)
    return exec_script_main

# The string for the Python executable we tell the Project file to use
# is either sys.executable or, if an external PYTHON_ROOT environment
# variable exists, $(PYTHON)ROOT\\python.exe (generalized a little to
# pluck the actual executable name from sys.executable).
try:
    python_root = os.environ['PYTHON_ROOT']
except KeyError:
    python_executable = sys.executable
else:
    python_executable = os.path.join('$$(PYTHON_ROOT)',
                                     os.path.split(sys.executable)[1])

class Config(object):
    pass

def splitFully(path):
    dir, base = os.path.split(path)
    if dir and dir != '' and dir != path:
        return splitFully(dir)+[base]
    if base == '':
        return []
    return [base]

def makeHierarchy(sources):
    '''Break a list of files into a hierarchy; for each value, if it is a string,
       then it is a file.  If it is a dictionary, it is a folder.  The string is
       the original path of the file.'''

    hierarchy = {}
    for file in sources:
        path = splitFully(file)
        if len(path):
            dict = hierarchy
            for part in path[:-1]:
                if part not in dict:
                    dict[part] = {}
                dict = dict[part]
            dict[path[-1]] = file
        #else:
        #    print 'Warning: failed to decompose path for '+str(file)
    return hierarchy

class _DSPGenerator(object):
    """ Base class for DSP generators """

    srcargs = [
        'srcs',
        'incs',
        'localincs',
        'resources',
        'misc']

    def __init__(self, dspfile, source, env):
        self.dspfile = str(dspfile)
        try:
            get_abspath = dspfile.get_abspath
        except AttributeError:
            self.dspabs = os.path.abspath(dspfile)
        else:
            self.dspabs = get_abspath()

        if 'variant' not in env:
            raise SCons.Errors.InternalError("You must specify a 'variant' argument (i.e. 'Debug' or " +\
                  "'Release') to create an MSVSProject.")
        elif SCons.Util.is_String(env['variant']):
            variants = [env['variant']]
        elif SCons.Util.is_List(env['variant']):
            variants = env['variant']

        if 'buildtarget' not in env or env['buildtarget'] == None:
            buildtarget = ['']
        elif SCons.Util.is_String(env['buildtarget']):
            buildtarget = [env['buildtarget']]
        elif SCons.Util.is_List(env['buildtarget']):
            if len(env['buildtarget']) != len(variants):
                raise SCons.Errors.InternalError("Sizes of 'buildtarget' and 'variant' lists must be the same.")
            buildtarget = []
            for bt in env['buildtarget']:
                if SCons.Util.is_String(bt):
                    buildtarget.append(bt)
                else:
                    buildtarget.append(bt.get_abspath())
        else:
            buildtarget = [env['buildtarget'].get_abspath()]
        if len(buildtarget) == 1:
            bt = buildtarget[0]
            buildtarget = []
            for _ in variants:
                buildtarget.append(bt)

        if 'outdir' not in env or env['outdir'] == None:
            outdir = ['']
        elif SCons.Util.is_String(env['outdir']):
            outdir = [env['outdir']]
        elif SCons.Util.is_List(env['outdir']):
            if len(env['outdir']) != len(variants):
                raise SCons.Errors.InternalError("Sizes of 'outdir' and 'variant' lists must be the same.")
            outdir = []
            for s in env['outdir']:
                if SCons.Util.is_String(s):
                    outdir.append(s)
                else:
                    outdir.append(s.get_abspath())
        else:
            outdir = [env['outdir'].get_abspath()]
        if len(outdir) == 1:
            s = outdir[0]
            outdir = []
            for v in variants:
                outdir.append(s)

        if 'runfile' not in env or env['runfile'] == None:
            runfile = buildtarget[-1:]
        elif SCons.Util.is_String(env['runfile']):
            runfile = [env['runfile']]
        elif SCons.Util.is_List(env['runfile']):
            if len(env['runfile']) != len(variants):
                raise SCons.Errors.InternalError("Sizes of 'runfile' and 'variant' lists must be the same.")
            runfile = []
            for s in env['runfile']:
                if SCons.Util.is_String(s):
                    runfile.append(s)
                else:
                    runfile.append(s.get_abspath())
        else:
            runfile = [env['runfile'].get_abspath()]
        if len(runfile) == 1:
            s = runfile[0]
            runfile = []
            for v in variants:
                runfile.append(s)

        self.sconscript = env['MSVSSCONSCRIPT']

        cmdargs = env.get('cmdargs', '')

        self.env = env

        if 'name' in self.env:
            self.name = self.env['name']
        else:
            self.name = os.path.basename(SCons.Util.splitext(self.dspfile)[0])
        self.name = self.env.subst(self.name)

        sourcenames = [
            'Source Files',
            'Header Files',
            'Local Headers',
            'Resource Files',
            'Other Files']

        self.sources = {}
        for n in sourcenames:
            self.sources[n] = []

        self.configs = {}

        self.nokeep = 0
        if 'nokeep' in env and env['variant'] != 0:
            self.nokeep = 1

        if self.nokeep == 0 and os.path.exists(self.dspabs):
            self.Parse()

        for t in zip(sourcenames,self.srcargs):
            if t[1] in self.env:
                if SCons.Util.is_List(self.env[t[1]]):
                    for i in self.env[t[1]]:
                        if not i in self.sources[t[0]]:
                            self.sources[t[0]].append(i)
                else:
                    if not self.env[t[1]] in self.sources[t[0]]:
                        self.sources[t[0]].append(self.env[t[1]])

        for n in sourcenames:
            #TODO 2.4: compat layer supports sorted(key=) but not sort(key=)
            #TODO 2.4: self.sources[n].sort(key=lambda a: a.lower())
            self.sources[n] = sorted(self.sources[n], key=lambda a: a.lower())

        def AddConfig(self, variant, buildtarget, outdir, runfile, cmdargs, dspfile=dspfile):
            config = Config()
            config.buildtarget = buildtarget
            config.outdir = outdir
            config.cmdargs = cmdargs
            config.runfile = runfile

            match = re.match('(.*)\|(.*)', variant)
            if match:
                config.variant = match.group(1)
                config.platform = match.group(2)
            else:
                config.variant = variant
                config.platform = 'Win32'

            self.configs[variant] = config
            print "Adding '" + self.name + ' - ' + config.variant + '|' + config.platform + "' to '" + str(dspfile) + "'"

        for i in range(len(variants)):
            AddConfig(self, variants[i], buildtarget[i], outdir[i], runfile[i], cmdargs)

        self.platforms = []
        for key in self.configs.keys():
            platform = self.configs[key].platform
            if not platform in self.platforms:
                self.platforms.append(platform)

    def Build(self):
        pass

V6DSPHeader = """\
# Microsoft Developer Studio Project File - Name="%(name)s" - Package Owner=<4>
# Microsoft Developer Studio Generated Build File, Format Version 6.00
# ** DO NOT EDIT **

# TARGTYPE "Win32 (x86) External Target" 0x0106

CFG=%(name)s - Win32 %(confkey)s
!MESSAGE This is not a valid makefile. To build this project using NMAKE,
!MESSAGE use the Export Makefile command and run
!MESSAGE 
!MESSAGE NMAKE /f "%(name)s.mak".
!MESSAGE 
!MESSAGE You can specify a configuration when running NMAKE
!MESSAGE by defining the macro CFG on the command line. For example:
!MESSAGE 
!MESSAGE NMAKE /f "%(name)s.mak" CFG="%(name)s - Win32 %(confkey)s"
!MESSAGE 
!MESSAGE Possible choices for configuration are:
!MESSAGE 
"""

class _GenerateV6DSP(_DSPGenerator):
    """Generates a Project file for MSVS 6.0"""

    def PrintHeader(self):
        # pick a default config
        confkeys = sorted(self.configs.keys())

        name = self.name
        confkey = confkeys[0]

        self.file.write(V6DSPHeader % locals())

        for kind in confkeys:
            self.file.write('!MESSAGE "%s - Win32 %s" (based on "Win32 (x86) External Target")\n' % (name, kind))

        self.file.write('!MESSAGE \n\n')

    def PrintProject(self):
        name = self.name
        self.file.write('# Begin Project\n'
                        '# PROP AllowPerConfigDependencies 0\n'
                        '# PROP Scc_ProjName ""\n'
                        '# PROP Scc_LocalPath ""\n\n')

        first = 1
        confkeys = sorted(self.configs.keys())
        for kind in confkeys:
            outdir = self.configs[kind].outdir
            buildtarget = self.configs[kind].buildtarget
            if first == 1:
                self.file.write('!IF  "$(CFG)" == "%s - Win32 %s"\n\n' % (name, kind))
                first = 0
            else:
                self.file.write('\n!ELSEIF  "$(CFG)" == "%s - Win32 %s"\n\n' % (name, kind))

            env_has_buildtarget = 'MSVSBUILDTARGET' in self.env
            if not env_has_buildtarget:
                self.env['MSVSBUILDTARGET'] = buildtarget

            # have to write this twice, once with the BASE settings, and once without
            for base in ("BASE ",""):
                self.file.write('# PROP %sUse_MFC 0\n'
                                '# PROP %sUse_Debug_Libraries ' % (base, base))
                if kind.lower().find('debug') < 0:
                    self.file.write('0\n')
                else:
                    self.file.write('1\n')
                self.file.write('# PROP %sOutput_Dir "%s"\n'
                                '# PROP %sIntermediate_Dir "%s"\n' % (base,outdir,base,outdir))
                cmd = 'echo Starting SCons && ' + self.env.subst('$MSVSBUILDCOM', 1)
                self.file.write('# PROP %sCmd_Line "%s"\n'
                                '# PROP %sRebuild_Opt "-c && %s"\n'
                                '# PROP %sTarget_File "%s"\n'
                                '# PROP %sBsc_Name ""\n'
                                '# PROP %sTarget_Dir ""\n'\
                                %(base,cmd,base,cmd,base,buildtarget,base,base))

            if not env_has_buildtarget:
                del self.env['MSVSBUILDTARGET']

        self.file.write('\n!ENDIF\n\n'
                        '# Begin Target\n\n')
        for kind in confkeys:
            self.file.write('# Name "%s - Win32 %s"\n' % (name,kind))
        self.file.write('\n')
        first = 0
        for kind in confkeys:
            if first == 0:
                self.file.write('!IF  "$(CFG)" == "%s - Win32 %s"\n\n' % (name,kind))
                first = 1
            else:
                self.file.write('!ELSEIF  "$(CFG)" == "%s - Win32 %s"\n\n' % (name,kind))
        self.file.write('!ENDIF \n\n')
        self.PrintSourceFiles()
        self.file.write('# End Target\n'
                        '# End Project\n')

        if self.nokeep == 0:
            # now we pickle some data and add it to the file -- MSDEV will ignore it.
            pdata = pickle.dumps(self.configs,1)
            pdata = base64.encodestring(pdata)
            self.file.write(pdata + '\n')
            pdata = pickle.dumps(self.sources,1)
            pdata = base64.encodestring(pdata)
            self.file.write(pdata + '\n')

    def PrintSourceFiles(self):
        categories = {'Source Files': 'cpp|c|cxx|l|y|def|odl|idl|hpj|bat',
                      'Header Files': 'h|hpp|hxx|hm|inl',
                      'Local Headers': 'h|hpp|hxx|hm|inl',
                      'Resource Files': 'r|rc|ico|cur|bmp|dlg|rc2|rct|bin|cnt|rtf|gif|jpg|jpeg|jpe',
                      'Other Files': ''}

        for kind in sorted(categories.keys(), key=lambda a: a.lower()):
            if not self.sources[kind]:
                continue # skip empty groups

            self.file.write('# Begin Group "' + kind + '"\n\n')
            typelist = categories[kind].replace('|', ';')
            self.file.write('# PROP Default_Filter "' + typelist + '"\n')

            for file in self.sources[kind]:
                file = os.path.normpath(file)
                self.file.write('# Begin Source File\n\n'
                                'SOURCE="' + file + '"\n'
                                '# End Source File\n')
            self.file.write('# End Group\n')

        # add the SConscript file outside of the groups
        self.file.write('# Begin Source File\n\n'
                        'SOURCE="' + str(self.sconscript) + '"\n'
                        '# End Source File\n')

    def Parse(self):
        try:
            dspfile = open(self.dspabs,'r')
        except IOError:
            return # doesn't exist yet, so can't add anything to configs.

        line = dspfile.readline()
        while line:
            if line.find("# End Project") > -1:
                break
            line = dspfile.readline()

        line = dspfile.readline()
        datas = line
        while line and line != '\n':
            line = dspfile.readline()
            datas = datas + line

        # OK, we've found our little pickled cache of data.
        try:
            datas = base64.decodestring(datas)
            data = pickle.loads(datas)
        except KeyboardInterrupt:
            raise
        except:
            return # unable to unpickle any data for some reason

        self.configs.update(data)

        data = None
        line = dspfile.readline()
        datas = line
        while line and line != '\n':
            line = dspfile.readline()
            datas = datas + line

        # OK, we've found our little pickled cache of data.
        # it has a "# " in front of it, so we strip that.
        try:
            datas = base64.decodestring(datas)
            data = pickle.loads(datas)
        except KeyboardInterrupt:
            raise
        except:
            return # unable to unpickle any data for some reason

        self.sources.update(data)

    def Build(self):
        try:
            self.file = open(self.dspabs,'w')
        except IOError, detail:
            raise SCons.Errors.InternalError('Unable to open "' + self.dspabs + '" for writing:' + str(detail))
        else:
            self.PrintHeader()
            self.PrintProject()
            self.file.close()

V7DSPHeader = """\
<?xml version="1.0" encoding = "%(encoding)s"?>
<VisualStudioProject
\tProjectType="Visual C++"
\tVersion="%(versionstr)s"
\tName="%(name)s"
%(scc_attrs)s
\tKeyword="MakeFileProj">
"""

V7DSPConfiguration = """\
\t\t<Configuration
\t\t\tName="%(variant)s|%(platform)s"
\t\t\tOutputDirectory="%(outdir)s"
\t\t\tIntermediateDirectory="%(outdir)s"
\t\t\tConfigurationType="0"
\t\t\tUseOfMFC="0"
\t\t\tATLMinimizesCRunTimeLibraryUsage="FALSE">
\t\t\t<Tool
\t\t\t\tName="VCNMakeTool"
\t\t\t\tBuildCommandLine="%(buildcmd)s"
\t\t\t\tCleanCommandLine="%(cleancmd)s"
\t\t\t\tRebuildCommandLine="%(rebuildcmd)s"
\t\t\t\tOutput="%(runfile)s"/>
\t\t</Configuration>
"""

V8DSPHeader = """\
<?xml version="1.0" encoding="%(encoding)s"?>
<VisualStudioProject
\tProjectType="Visual C++"
\tVersion="%(versionstr)s"
\tName="%(name)s"
%(scc_attrs)s
\tRootNamespace="%(name)s"
\tKeyword="MakeFileProj">
"""

V8DSPConfiguration = """\
\t\t<Configuration
\t\t\tName="%(variant)s|%(platform)s"
\t\t\tConfigurationType="0"
\t\t\tUseOfMFC="0"
\t\t\tATLMinimizesCRunTimeLibraryUsage="false"
\t\t\t>
\t\t\t<Tool
\t\t\t\tName="VCNMakeTool"
\t\t\t\tBuildCommandLine="%(buildcmd)s"
\t\t\t\tReBuildCommandLine="%(rebuildcmd)s"
\t\t\t\tCleanCommandLine="%(cleancmd)s"
\t\t\t\tOutput="%(runfile)s"
\t\t\t\tPreprocessorDefinitions="%(preprocdefs)s"
\t\t\t\tIncludeSearchPath="%(includepath)s"
\t\t\t\tForcedIncludes=""
\t\t\t\tAssemblySearchPath=""
\t\t\t\tForcedUsingAssemblies=""
\t\t\t\tCompileAsManaged=""
\t\t\t/>
\t\t</Configuration>
"""
class _GenerateV7DSP(_DSPGenerator):
    """Generates a Project file for MSVS .NET"""

    def __init__(self, dspfile, source, env):
        _DSPGenerator.__init__(self, dspfile, source, env)
        self.version = env['MSVS_VERSION']
        self.version_num, self.suite = msvs_parse_version(self.version)
        if self.version_num >= 8.0:
            self.versionstr = '8.00'
            self.dspheader = V8DSPHeader
            self.dspconfiguration = V8DSPConfiguration
        else:
            if self.version_num >= 7.1:
                self.versionstr = '7.10'
            else:
                self.versionstr = '7.00'
            self.dspheader = V7DSPHeader
            self.dspconfiguration = V7DSPConfiguration
        self.file = None

    def PrintHeader(self):
        env = self.env
        versionstr = self.versionstr
        name = self.name
        encoding = self.env.subst('$MSVSENCODING')
        scc_provider = env.get('MSVS_SCC_PROVIDER', '')
        scc_project_name = env.get('MSVS_SCC_PROJECT_NAME', '')
        scc_aux_path = env.get('MSVS_SCC_AUX_PATH', '')
        scc_local_path = env.get('MSVS_SCC_LOCAL_PATH', '')
        project_guid = env.get('MSVS_PROJECT_GUID', '')
        if self.version_num >= 8.0 and not project_guid:
            project_guid = _generateGUID(self.dspfile, '')
        if scc_provider != '':
            scc_attrs = ('\tProjectGUID="%s"\n'
                         '\tSccProjectName="%s"\n'
                         '\tSccAuxPath="%s"\n'
                         '\tSccLocalPath="%s"\n'
                         '\tSccProvider="%s"' % (project_guid, scc_project_name, scc_aux_path, scc_local_path, scc_provider))
        else:
            scc_attrs = ('\tProjectGUID="%s"\n'
                         '\tSccProjectName="%s"\n'
                         '\tSccLocalPath="%s"' % (project_guid, scc_project_name, scc_local_path))

        self.file.write(self.dspheader % locals())

        self.file.write('\t<Platforms>\n')
        for platform in self.platforms:
            self.file.write(
                        '\t\t<Platform\n'
                        '\t\t\tName="%s"/>\n' % platform)
        self.file.write('\t</Platforms>\n')

        if self.version_num >= 8.0:
            self.file.write('\t<ToolFiles>\n'
                            '\t</ToolFiles>\n')

    def PrintProject(self):
        self.file.write('\t<Configurations>\n')

        confkeys = sorted(self.configs.keys())
        for kind in confkeys:
            variant = self.configs[kind].variant
            platform = self.configs[kind].platform
            outdir = self.configs[kind].outdir
            buildtarget = self.configs[kind].buildtarget
            runfile     = self.configs[kind].runfile
            cmdargs = self.configs[kind].cmdargs

            env_has_buildtarget = 'MSVSBUILDTARGET' in self.env
            if not env_has_buildtarget:
                self.env['MSVSBUILDTARGET'] = buildtarget

            starting = 'echo Starting SCons && '
            if cmdargs:
                cmdargs = ' ' + cmdargs
            else:
                cmdargs = ''
            buildcmd    = xmlify(starting + self.env.subst('$MSVSBUILDCOM', 1) + cmdargs)
            rebuildcmd  = xmlify(starting + self.env.subst('$MSVSREBUILDCOM', 1) + cmdargs)
            cleancmd    = xmlify(starting + self.env.subst('$MSVSCLEANCOM', 1) + cmdargs)

            preprocdefs = xmlify(';'.join(processDefines(self.env.get('CPPDEFINES', []))))
            includepath = xmlify(';'.join(self.env.get('CPPPATH', [])))

            if not env_has_buildtarget:
                del self.env['MSVSBUILDTARGET']

            self.file.write(self.dspconfiguration % locals())

        self.file.write('\t</Configurations>\n')

        if self.version_num >= 7.1:
            self.file.write('\t<References>\n'
                            '\t</References>\n')

        self.PrintSourceFiles()

        self.file.write('</VisualStudioProject>\n')

        if self.nokeep == 0:
            # now we pickle some data and add it to the file -- MSDEV will ignore it.
            pdata = pickle.dumps(self.configs,1)
            pdata = base64.encodestring(pdata)
            self.file.write('<!-- SCons Data:\n' + pdata + '\n')
            pdata = pickle.dumps(self.sources,1)
            pdata = base64.encodestring(pdata)
            self.file.write(pdata + '-->\n')

    def printSources(self, hierarchy, commonprefix):
        sorteditems = sorted(hierarchy.items(), key=lambda a: a[0].lower())

        # First folders, then files
        for key, value in sorteditems:
            if SCons.Util.is_Dict(value):
                self.file.write('\t\t\t<Filter\n'
                                '\t\t\t\tName="%s"\n'
                                '\t\t\t\tFilter="">\n' % (key))
                self.printSources(value, commonprefix)
                self.file.write('\t\t\t</Filter>\n')

        for key, value in sorteditems:
            if SCons.Util.is_String(value):
                file = value
                if commonprefix:
                    file = os.path.join(commonprefix, value)
                file = os.path.normpath(file)
                self.file.write('\t\t\t<File\n'
                                '\t\t\t\tRelativePath="%s">\n'
                                '\t\t\t</File>\n' % (file))

    def PrintSourceFiles(self):
        categories = {'Source Files': 'cpp;c;cxx;l;y;def;odl;idl;hpj;bat',
                      'Header Files': 'h;hpp;hxx;hm;inl',
                      'Local Headers': 'h;hpp;hxx;hm;inl',
                      'Resource Files': 'r;rc;ico;cur;bmp;dlg;rc2;rct;bin;cnt;rtf;gif;jpg;jpeg;jpe',
                      'Other Files': ''}

        self.file.write('\t<Files>\n')

        cats = sorted([k for k in categories.keys() if self.sources[k]],
                      key=lambda a: a.lower())
        for kind in cats:
            if len(cats) > 1:
                self.file.write('\t\t<Filter\n'
                                '\t\t\tName="%s"\n'
                                '\t\t\tFilter="%s">\n' % (kind, categories[kind]))

            sources = self.sources[kind]

            # First remove any common prefix
            commonprefix = None
            if len(sources) > 1:
                s = list(map(os.path.normpath, sources))
                # take the dirname because the prefix may include parts
                # of the filenames (e.g. if you have 'dir\abcd' and
                # 'dir\acde' then the cp will be 'dir\a' )
                cp = os.path.dirname( os.path.commonprefix(s) )
                if cp and s[0][len(cp)] == os.sep:
                    # +1 because the filename starts after the separator
                    sources = [s[len(cp)+1:] for s in sources]
                    commonprefix = cp
            elif len(sources) == 1:
                commonprefix = os.path.dirname( sources[0] )
                sources[0] = os.path.basename( sources[0] )

            hierarchy = makeHierarchy(sources)
            self.printSources(hierarchy, commonprefix=commonprefix)

            if len(cats)>1:
                self.file.write('\t\t</Filter>\n')

        # add the SConscript file outside of the groups
        self.file.write('\t\t<File\n'
                        '\t\t\tRelativePath="%s">\n'
                        '\t\t</File>\n' % str(self.sconscript))

        self.file.write('\t</Files>\n'
                        '\t<Globals>\n'
                        '\t</Globals>\n')

    def Parse(self):
        try:
            dspfile = open(self.dspabs,'r')
        except IOError:
            return # doesn't exist yet, so can't add anything to configs.

        line = dspfile.readline()
        while line:
            if line.find('<!-- SCons Data:') > -1:
                break
            line = dspfile.readline()

        line = dspfile.readline()
        datas = line
        while line and line != '\n':
            line = dspfile.readline()
            datas = datas + line

        # OK, we've found our little pickled cache of data.
        try:
            datas = base64.decodestring(datas)
            data = pickle.loads(datas)
        except KeyboardInterrupt:
            raise
        except:
            return # unable to unpickle any data for some reason

        self.configs.update(data)

        data = None
        line = dspfile.readline()
        datas = line
        while line and line != '\n':
            line = dspfile.readline()
            datas = datas + line

        # OK, we've found our little pickled cache of data.
        try:
            datas = base64.decodestring(datas)
            data = pickle.loads(datas)
        except KeyboardInterrupt:
            raise
        except:
            return # unable to unpickle any data for some reason

        self.sources.update(data)

    def Build(self):
        try:
            self.file = open(self.dspabs,'w')
        except IOError, detail:
            raise SCons.Errors.InternalError('Unable to open "' + self.dspabs + '" for writing:' + str(detail))
        else:
            self.PrintHeader()
            self.PrintProject()
            self.file.close()

class _DSWGenerator(object):
    """ Base class for DSW generators """
    def __init__(self, dswfile, source, env):
        self.dswfile = os.path.normpath(str(dswfile))
        self.env = env

        if 'projects' not in env:
            raise SCons.Errors.UserError("You must specify a 'projects' argument to create an MSVSSolution.")
        projects = env['projects']
        if not SCons.Util.is_List(projects):
            raise SCons.Errors.InternalError("The 'projects' argument must be a list of nodes.")
        projects = SCons.Util.flatten(projects)
        if len(projects) < 1:
            raise SCons.Errors.UserError("You must specify at least one project to create an MSVSSolution.")
        self.dspfiles = list(map(str, projects))

        if 'name' in self.env:
            self.name = self.env['name']
        else:
            self.name = os.path.basename(SCons.Util.splitext(self.dswfile)[0])
        self.name = self.env.subst(self.name)

    def Build(self):
        pass

class _GenerateV7DSW(_DSWGenerator):
    """Generates a Solution file for MSVS .NET"""
    def __init__(self, dswfile, source, env):
        _DSWGenerator.__init__(self, dswfile, source, env)

        self.file = None
        self.version = self.env['MSVS_VERSION']
        self.version_num, self.suite = msvs_parse_version(self.version)
        self.versionstr = '7.00'
        if self.version_num >= 8.0:
            self.versionstr = '9.00'
        elif self.version_num >= 7.1:
            self.versionstr = '8.00'
        if self.version_num >= 8.0:
            self.versionstr = '9.00'

        if 'slnguid' in env and env['slnguid']:
            self.slnguid = env['slnguid']
        else:
            self.slnguid = _generateGUID(dswfile, self.name)

        self.configs = {}

        self.nokeep = 0
        if 'nokeep' in env and env['variant'] != 0:
            self.nokeep = 1

        if self.nokeep == 0 and os.path.exists(self.dswfile):
            self.Parse()

        def AddConfig(self, variant, dswfile=dswfile):
            config = Config()

            match = re.match('(.*)\|(.*)', variant)
            if match:
                config.variant = match.group(1)
                config.platform = match.group(2)
            else:
                config.variant = variant
                config.platform = 'Win32'

            self.configs[variant] = config
            print "Adding '" + self.name + ' - ' + config.variant + '|' + config.platform + "' to '" + str(dswfile) + "'"

        if 'variant' not in env:
            raise SCons.Errors.InternalError("You must specify a 'variant' argument (i.e. 'Debug' or " +\
                  "'Release') to create an MSVS Solution File.")
        elif SCons.Util.is_String(env['variant']):
            AddConfig(self, env['variant'])
        elif SCons.Util.is_List(env['variant']):
            for variant in env['variant']:
                AddConfig(self, variant)

        self.platforms = []
        for key in self.configs.keys():
            platform = self.configs[key].platform
            if not platform in self.platforms:
                self.platforms.append(platform)

    def Parse(self):
        try:
            dswfile = open(self.dswfile,'r')
        except IOError:
            return # doesn't exist yet, so can't add anything to configs.

        line = dswfile.readline()
        while line:
            if line[:9] == "EndGlobal":
                break
            line = dswfile.readline()

        line = dswfile.readline()
        datas = line
        while line:
            line = dswfile.readline()
            datas = datas + line

        # OK, we've found our little pickled cache of data.
        try:
            datas = base64.decodestring(datas)
            data = pickle.loads(datas)
        except KeyboardInterrupt:
            raise
        except:
            return # unable to unpickle any data for some reason

        self.configs.update(data)

    def PrintSolution(self):
        """Writes a solution file"""
        self.file.write('Microsoft Visual Studio Solution File, Format Version %s\n' % self.versionstr )
        if self.version_num >= 8.0:
            self.file.write('# Visual Studio 2005\n')
        for p in self.dspfiles:
            name = os.path.basename(p)
            base, suffix = SCons.Util.splitext(name)
            if suffix == '.vcproj':
                name = base
            guid = _generateGUID(p, '')
            self.file.write('Project("%s") = "%s", "%s", "%s"\n'
                            % ( external_makefile_guid, name, p, guid ) )
            if self.version_num >= 7.1 and self.version_num < 8.0:
                self.file.write('\tProjectSection(ProjectDependencies) = postProject\n'
                                '\tEndProjectSection\n')
            self.file.write('EndProject\n')

        self.file.write('Global\n')

        env = self.env
        if 'MSVS_SCC_PROVIDER' in env:
            dspfile_base = os.path.basename(self.dspfile)
            slnguid = self.slnguid
            scc_provider = env.get('MSVS_SCC_PROVIDER', '')
            scc_provider = scc_provider.replace(' ', r'\u0020')
            scc_project_name = env.get('MSVS_SCC_PROJECT_NAME', '')
            # scc_aux_path = env.get('MSVS_SCC_AUX_PATH', '')
            scc_local_path = env.get('MSVS_SCC_LOCAL_PATH', '')
            scc_project_base_path = env.get('MSVS_SCC_PROJECT_BASE_PATH', '')
            # project_guid = env.get('MSVS_PROJECT_GUID', '')

            self.file.write('\tGlobalSection(SourceCodeControl) = preSolution\n'
                            '\t\tSccNumberOfProjects = 2\n'
                            '\t\tSccProjectUniqueName0 = %(dspfile_base)s\n'
                            '\t\tSccLocalPath0 = %(scc_local_path)s\n'
                            '\t\tCanCheckoutShared = true\n'
                            '\t\tSccProjectFilePathRelativizedFromConnection0 = %(scc_project_base_path)s\n'
                            '\t\tSccProjectName1 = %(scc_project_name)s\n'
                            '\t\tSccLocalPath1 = %(scc_local_path)s\n'
                            '\t\tSccProvider1 = %(scc_provider)s\n'
                            '\t\tCanCheckoutShared = true\n'
                            '\t\tSccProjectFilePathRelativizedFromConnection1 = %(scc_project_base_path)s\n'
                            '\t\tSolutionUniqueID = %(slnguid)s\n'
                            '\tEndGlobalSection\n' % locals())

        if self.version_num >= 8.0:
            self.file.write('\tGlobalSection(SolutionConfigurationPlatforms) = preSolution\n')
        else:
            self.file.write('\tGlobalSection(SolutionConfiguration) = preSolution\n')

        confkeys = sorted(self.configs.keys())
        cnt = 0
        for name in confkeys:
            variant = self.configs[name].variant
            platform = self.configs[name].platform
            if self.version_num >= 8.0:
                self.file.write('\t\t%s|%s = %s|%s\n' % (variant, platform, variant, platform))
            else:
                self.file.write('\t\tConfigName.%d = %s\n' % (cnt, variant))
            cnt = cnt + 1
        self.file.write('\tEndGlobalSection\n')
        if self.version_num < 7.1:
            self.file.write('\tGlobalSection(ProjectDependencies) = postSolution\n'
                            '\tEndGlobalSection\n')
        if self.version_num >= 8.0:
            self.file.write('\tGlobalSection(ProjectConfigurationPlatforms) = postSolution\n')
        else:
            self.file.write('\tGlobalSection(ProjectConfiguration) = postSolution\n')

        for name in confkeys:
            variant = self.configs[name].variant
            platform = self.configs[name].platform
            if self.version_num >= 8.0:
                for p in self.dspfiles:
                    guid = _generateGUID(p, '')
                    self.file.write('\t\t%s.%s|%s.ActiveCfg = %s|%s\n'
                                    '\t\t%s.%s|%s.Build.0 = %s|%s\n'  % (guid,variant,platform,variant,platform,guid,variant,platform,variant,platform))
            else:
                for p in self.dspfiles:
                    guid = _generateGUID(p, '')
                    self.file.write('\t\t%s.%s.ActiveCfg = %s|%s\n'
                                    '\t\t%s.%s.Build.0 = %s|%s\n'  %(guid,variant,variant,platform,guid,variant,variant,platform))

        self.file.write('\tEndGlobalSection\n')

        if self.version_num >= 8.0:
            self.file.write('\tGlobalSection(SolutionProperties) = preSolution\n'
                            '\t\tHideSolutionNode = FALSE\n'
                            '\tEndGlobalSection\n')
        else:
            self.file.write('\tGlobalSection(ExtensibilityGlobals) = postSolution\n'
                            '\tEndGlobalSection\n'
                            '\tGlobalSection(ExtensibilityAddIns) = postSolution\n'
                            '\tEndGlobalSection\n')
        self.file.write('EndGlobal\n')
        if self.nokeep == 0:
            pdata = pickle.dumps(self.configs,1)
            pdata = base64.encodestring(pdata)
            self.file.write(pdata + '\n')

    def Build(self):
        try:
            self.file = open(self.dswfile,'w')
        except IOError, detail:
            raise SCons.Errors.InternalError('Unable to open "' + self.dswfile + '" for writing:' + str(detail))
        else:
            self.PrintSolution()
            self.file.close()

V6DSWHeader = """\
Microsoft Developer Studio Workspace File, Format Version 6.00
# WARNING: DO NOT EDIT OR DELETE THIS WORKSPACE FILE!

###############################################################################

Project: "%(name)s"="%(dspfile)s" - Package Owner=<4>

Package=<5>
{{{
}}}

Package=<4>
{{{
}}}

###############################################################################

Global:

Package=<5>
{{{
}}}

Package=<3>
{{{
}}}

###############################################################################
"""

class _GenerateV6DSW(_DSWGenerator):
    """Generates a Workspace file for MSVS 6.0"""

    def PrintWorkspace(self):
        """ writes a DSW file """
        name = self.name
        dspfile = self.dspfiles[0]
        self.file.write(V6DSWHeader % locals())

    def Build(self):
        try:
            self.file = open(self.dswfile,'w')
        except IOError, detail:
            raise SCons.Errors.InternalError('Unable to open "' + self.dswfile + '" for writing:' + str(detail))
        else:
            self.PrintWorkspace()
            self.file.close()


def GenerateDSP(dspfile, source, env):
    """Generates a Project file based on the version of MSVS that is being used"""

    version_num = 6.0
    if 'MSVS_VERSION' in env:
        version_num, suite = msvs_parse_version(env['MSVS_VERSION'])
    if version_num >= 7.0:
        g = _GenerateV7DSP(dspfile, source, env)
        g.Build()
    else:
        g = _GenerateV6DSP(dspfile, source, env)
        g.Build()

def GenerateDSW(dswfile, source, env):
    """Generates a Solution/Workspace file based on the version of MSVS that is being used"""

    version_num = 6.0
    if 'MSVS_VERSION' in env:
        version_num, suite = msvs_parse_version(env['MSVS_VERSION'])
    if version_num >= 7.0:
        g = _GenerateV7DSW(dswfile, source, env)
        g.Build()
    else:
        g = _GenerateV6DSW(dswfile, source, env)
        g.Build()


##############################################################################
# Above here are the classes and functions for generation of
# DSP/DSW/SLN/VCPROJ files.
##############################################################################

def GetMSVSProjectSuffix(target, source, env, for_signature):
     return env['MSVS']['PROJECTSUFFIX']

def GetMSVSSolutionSuffix(target, source, env, for_signature):
     return env['MSVS']['SOLUTIONSUFFIX']

def GenerateProject(target, source, env):
    # generate the dsp file, according to the version of MSVS.
    builddspfile = target[0]
    dspfile = builddspfile.srcnode()

    # this detects whether or not we're using a VariantDir
    if not dspfile is builddspfile:
        try:
            bdsp = open(str(builddspfile), "w+")
        except IOError, detail:
            print 'Unable to open "' + str(dspfile) + '" for writing:',detail,'\n'
            raise

        bdsp.write("This is just a placeholder file.\nThe real project file is here:\n%s\n" % dspfile.get_abspath())

    GenerateDSP(dspfile, source, env)

    if env.get('auto_build_solution', 1):
        builddswfile = target[1]
        dswfile = builddswfile.srcnode()

        if not dswfile is builddswfile:

            try:
                bdsw = open(str(builddswfile), "w+")
            except IOError, detail:
                print 'Unable to open "' + str(dspfile) + '" for writing:',detail,'\n'
                raise

            bdsw.write("This is just a placeholder file.\nThe real workspace file is here:\n%s\n" % dswfile.get_abspath())

        GenerateDSW(dswfile, source, env)

def GenerateSolution(target, source, env):
    GenerateDSW(target[0], source, env)

def projectEmitter(target, source, env):
    """Sets up the DSP dependencies."""

    # todo: Not sure what sets source to what user has passed as target,
    # but this is what happens. When that is fixed, we also won't have
    # to make the user always append env['MSVSPROJECTSUFFIX'] to target.
    if source[0] == target[0]:
        source = []

    # make sure the suffix is correct for the version of MSVS we're running.
    (base, suff) = SCons.Util.splitext(str(target[0]))
    suff = env.subst('$MSVSPROJECTSUFFIX')
    target[0] = base + suff

    if not source:
        source = 'prj_inputs:'
        source = source + env.subst('$MSVSSCONSCOM', 1)
        source = source + env.subst('$MSVSENCODING', 1)

        if 'buildtarget' in env and env['buildtarget'] != None:
            if SCons.Util.is_String(env['buildtarget']):
                source = source + ' "%s"' % env['buildtarget']
            elif SCons.Util.is_List(env['buildtarget']):
                for bt in env['buildtarget']:
                    if SCons.Util.is_String(bt):
                        source = source + ' "%s"' % bt
                    else:
                        try: source = source + ' "%s"' % bt.get_abspath()
                        except AttributeError: raise SCons.Errors.InternalError("buildtarget can be a string, a node, a list of strings or nodes, or None")
            else:
                try: source = source + ' "%s"' % env['buildtarget'].get_abspath()
                except AttributeError: raise SCons.Errors.InternalError("buildtarget can be a string, a node, a list of strings or nodes, or None")

        if 'outdir' in env and env['outdir'] != None:
            if SCons.Util.is_String(env['outdir']):
                source = source + ' "%s"' % env['outdir']
            elif SCons.Util.is_List(env['outdir']):
                for s in env['outdir']:
                    if SCons.Util.is_String(s):
                        source = source + ' "%s"' % s
                    else:
                        try: source = source + ' "%s"' % s.get_abspath()
                        except AttributeError: raise SCons.Errors.InternalError("outdir can be a string, a node, a list of strings or nodes, or None")
            else:
                try: source = source + ' "%s"' % env['outdir'].get_abspath()
                except AttributeError: raise SCons.Errors.InternalError("outdir can be a string, a node, a list of strings or nodes, or None")

        if 'name' in env:
            if SCons.Util.is_String(env['name']):
                source = source + ' "%s"' % env['name']
            else:
                raise SCons.Errors.InternalError("name must be a string")

        if 'variant' in env:
            if SCons.Util.is_String(env['variant']):
                source = source + ' "%s"' % env['variant']
            elif SCons.Util.is_List(env['variant']):
                for variant in env['variant']:
                    if SCons.Util.is_String(variant):
                        source = source + ' "%s"' % variant
                    else:
                        raise SCons.Errors.InternalError("name must be a string or a list of strings")
            else:
                raise SCons.Errors.InternalError("variant must be a string or a list of strings")
        else:
            raise SCons.Errors.InternalError("variant must be specified")

        for s in _DSPGenerator.srcargs:
            if s in env:
                if SCons.Util.is_String(env[s]):
                    source = source + ' "%s' % env[s]
                elif SCons.Util.is_List(env[s]):
                    for t in env[s]:
                        if SCons.Util.is_String(t):
                            source = source + ' "%s"' % t
                        else:
                            raise SCons.Errors.InternalError(s + " must be a string or a list of strings")
                else:
                    raise SCons.Errors.InternalError(s + " must be a string or a list of strings")

        source = source + ' "%s"' % str(target[0])
        source = [SCons.Node.Python.Value(source)]

    targetlist = [target[0]]
    sourcelist = source

    if env.get('auto_build_solution', 1):
        env['projects'] = targetlist
        t, s = solutionEmitter(target, target, env)
        targetlist = targetlist + t

    return (targetlist, sourcelist)

def solutionEmitter(target, source, env):
    """Sets up the DSW dependencies."""

    # todo: Not sure what sets source to what user has passed as target,
    # but this is what happens. When that is fixed, we also won't have
    # to make the user always append env['MSVSSOLUTIONSUFFIX'] to target.
    if source[0] == target[0]:
        source = []

    # make sure the suffix is correct for the version of MSVS we're running.
    (base, suff) = SCons.Util.splitext(str(target[0]))
    suff = env.subst('$MSVSSOLUTIONSUFFIX')
    target[0] = base + suff

    if not source:
        source = 'sln_inputs:'

        if 'name' in env:
            if SCons.Util.is_String(env['name']):
                source = source + ' "%s"' % env['name']
            else:
                raise SCons.Errors.InternalError("name must be a string")

        if 'variant' in env:
            if SCons.Util.is_String(env['variant']):
                source = source + ' "%s"' % env['variant']
            elif SCons.Util.is_List(env['variant']):
                for variant in env['variant']:
                    if SCons.Util.is_String(variant):
                        source = source + ' "%s"' % variant
                    else:
                        raise SCons.Errors.InternalError("name must be a string or a list of strings")
            else:
                raise SCons.Errors.InternalError("variant must be a string or a list of strings")
        else:
            raise SCons.Errors.InternalError("variant must be specified")

        if 'slnguid' in env:
            if SCons.Util.is_String(env['slnguid']):
                source = source + ' "%s"' % env['slnguid']
            else:
                raise SCons.Errors.InternalError("slnguid must be a string")

        if 'projects' in env:
            if SCons.Util.is_String(env['projects']):
                source = source + ' "%s"' % env['projects']
            elif SCons.Util.is_List(env['projects']):
                for t in env['projects']:
                    if SCons.Util.is_String(t):
                        source = source + ' "%s"' % t

        source = source + ' "%s"' % str(target[0])
        source = [SCons.Node.Python.Value(source)]

    return ([target[0]], source)

projectAction = SCons.Action.Action(GenerateProject, None)

solutionAction = SCons.Action.Action(GenerateSolution, None)

projectBuilder = SCons.Builder.Builder(action = '$MSVSPROJECTCOM',
                                       suffix = '$MSVSPROJECTSUFFIX',
                                       emitter = projectEmitter)

solutionBuilder = SCons.Builder.Builder(action = '$MSVSSOLUTIONCOM',
                                        suffix = '$MSVSSOLUTIONSUFFIX',
                                        emitter = solutionEmitter)

default_MSVS_SConscript = None

def generate(env):
    """Add Builders and construction variables for Microsoft Visual
    Studio project files to an Environment."""
    try:
        env['BUILDERS']['MSVSProject']
    except KeyError:
        env['BUILDERS']['MSVSProject'] = projectBuilder

    try:
        env['BUILDERS']['MSVSSolution']
    except KeyError:
        env['BUILDERS']['MSVSSolution'] = solutionBuilder

    env['MSVSPROJECTCOM'] = projectAction
    env['MSVSSOLUTIONCOM'] = solutionAction

    if SCons.Script.call_stack:
        # XXX Need to find a way to abstract this; the build engine
        # shouldn't depend on anything in SCons.Script.
        env['MSVSSCONSCRIPT'] = SCons.Script.call_stack[0].sconscript
    else:
        global default_MSVS_SConscript
        if default_MSVS_SConscript is None:
            default_MSVS_SConscript = env.File('SConstruct')
        env['MSVSSCONSCRIPT'] = default_MSVS_SConscript

    env['MSVSSCONS'] = '"%s" -c "%s"' % (python_executable, getExecScriptMain(env))
    env['MSVSSCONSFLAGS'] = '-C "${MSVSSCONSCRIPT.dir.abspath}" -f ${MSVSSCONSCRIPT.name}'
    env['MSVSSCONSCOM'] = '$MSVSSCONS $MSVSSCONSFLAGS'
    env['MSVSBUILDCOM'] = '$MSVSSCONSCOM "$MSVSBUILDTARGET"'
    env['MSVSREBUILDCOM'] = '$MSVSSCONSCOM "$MSVSBUILDTARGET"'
    env['MSVSCLEANCOM'] = '$MSVSSCONSCOM -c "$MSVSBUILDTARGET"'
    env['MSVSENCODING'] = 'Windows-1252'

    # Set-up ms tools paths for default version
    msvc_setup_env_once(env)

    if 'MSVS_VERSION' in env:
        version_num, suite = msvs_parse_version(env['MSVS_VERSION'])
    else:
        (version_num, suite) = (7.0, None) # guess at a default
    if 'MSVS' not in env:
        env['MSVS'] = {}
    if (version_num < 7.0):
        env['MSVS']['PROJECTSUFFIX']  = '.dsp'
        env['MSVS']['SOLUTIONSUFFIX'] = '.dsw'
    else:
        env['MSVS']['PROJECTSUFFIX']  = '.vcproj'
        env['MSVS']['SOLUTIONSUFFIX'] = '.sln'

    env['GET_MSVSPROJECTSUFFIX']  = GetMSVSProjectSuffix
    env['GET_MSVSSOLUTIONSUFFIX']  = GetMSVSSolutionSuffix
    env['MSVSPROJECTSUFFIX']  = '${GET_MSVSPROJECTSUFFIX}'
    env['MSVSSOLUTIONSUFFIX']  = '${GET_MSVSSOLUTIONSUFFIX}'
    env['SCONS_HOME'] = os.environ.get('SCONS_HOME')

def exists(env):
    return msvc_exists()

# Local Variables:
# tab-width:4
# indent-tabs-mode:nil
# End:
# vim: set expandtab tabstop=4 shiftwidth=4:

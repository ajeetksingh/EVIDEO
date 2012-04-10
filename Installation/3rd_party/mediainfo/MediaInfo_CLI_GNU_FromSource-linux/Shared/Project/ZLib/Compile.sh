#! /bin/sh

#############################################################################
# Configure
Source_Dest=../../Source
Home=`pwd`

#############################################################################
# Already compiled
if test -e $Source_Dest/ZLib/zlib.a || test -e $Source_Dest/ZLib/zlib.la; then
 echo ZLib is already compiled
 exit
fi

#############################################################################
# Is exist?
if test -d $Source_Dest/ZLib; then
	echo ZLib is already present
else
 echo Downloading ZLib
 chmod 700 ./Source_Get.sh
 ./Source_Get.sh
 if test -d $Source_Dest/ZLib; then
 echo Downloaded ZLib
 else
  echo Error while downloading ZLib
  exit
 fi
fi

#############################################################################
# Compile
cd  $Source_Dest/ZLib
test -e Makefile && make clean
if test -e /usr/bin/libtoolize; then
rm configure
cp ../../Project/ZLib/Template/projects/GNU/* ./
libtoolize --automake
aclocal
automake -a
autoconf
./configure $*
else
./configure
fi
make clean
mkdir zlib
make
cp zlib.h zlib
cp zconf.h zlib

#############################################################################
# Going home
cd $Home
#! /bin/sh

#############################################################################
# Configure
Source_Dest=../../Source
Home=`pwd`

#############################################################################
# Already compiled
if test -e $Source_Dest/WxWidgets/Compile/lib/libwx_*; then
 echo WxWidgets is already compiled, recompiling it
fi

#############################################################################
# Is exist?
if test -d $Source_Dest/WxWidgets; then
	echo WxWidgets is already present
else
 echo Downloading WxWidgets
 chmod 700 ./Source_Get.sh
 ./Source_Get.sh
 if test -d $Source_Dest/WxWidgets; then
 echo Downloaded WxWidgets
 else
  echo Error while downloading WxWidgets
  exit
 fi
fi

#############################################################################
# Compile
cd  $Source_Dest/WxWidgets
test -d Compile || mkdir -p Compile
cd Compile
test -e Makefile && make clean
echo " --disable-shared --disable-gui --enable-unicode --enable-monolithic $*"
../configure --disable-shared --disable-gui --enable-unicode --enable-monolithic $*
make clean
make

#############################################################################
# Going home
cd $Home
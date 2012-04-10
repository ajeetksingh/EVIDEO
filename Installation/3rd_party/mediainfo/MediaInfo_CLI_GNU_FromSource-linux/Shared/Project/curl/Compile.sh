#! /bin/sh

#############################################################################
# Configure
Source_Dest=../../Source
Home=`pwd`

#############################################################################
# Already compiled
if test -e $Source_Dest/curl/lib/libcurl.a || test -e $Source_Dest/curl/lib/libcurl.la; then
 echo curl is already compiled
 exit
fi

#############################################################################
# Is exist?
if test -d $Source_Dest/curl; then
	echo curl is already present
else
 echo Downloading curl
 chmod 700 ./Source_Get.sh
 ./Source_Get.sh
 if test -d $Source_Dest/curl; then
 echo Downloaded curl
 else
  echo Error while downloading curl
  exit
 fi
fi

#############################################################################
# Compile
cd  $Source_Dest/curl
test -e Makefile && make clean
./configure --disable-shared
make clean
make

#############################################################################
# Going home
cd $Home
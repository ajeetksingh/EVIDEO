#! /bin/sh

#############################################################################
# Configure
Version=7.20.1
Module="curl"
Web_Folder="http://curl.haxx.se/download/"
File_Name="curl-$Version"
Method=".tar.bz2"

#############################################################################
# Download
. ../_Common/Source_Get.sh
Zen_Source_Get $Module $Web_Folder $File_Name $Method


#! /bin/sh

#############################################################################
# Configure
Version=1.2.5
Module="ZLib"
Web_Folder="http://www.zlib.net/"
File_Name="zlib-$Version"
Method=".tar.gz"

#############################################################################
# Download
. ../_Common/Source_Get.sh
Zen_Source_Get $Module $Web_Folder $File_Name $Method


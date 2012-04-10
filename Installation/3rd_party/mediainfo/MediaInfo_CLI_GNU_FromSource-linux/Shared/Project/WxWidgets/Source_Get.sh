#! /bin/sh

#############################################################################
# Configure
Version=2.8.10
Module="WxWidgets"
Web_Folder="http://ovh.dl.sourceforge.net/wxwindows/"
File_Name="wxWidgets-$Version"
Method=".tar.bz2"

#############################################################################
# Download
. ../_Common/Source_Get.sh
Zen_Source_Get $Module $Web_Folder $File_Name $Method


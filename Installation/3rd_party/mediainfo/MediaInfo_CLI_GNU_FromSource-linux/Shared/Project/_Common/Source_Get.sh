Zen_Source_Get()
{

Module="$1"
Web_Folder="$2"
File_Name="$3"
Method="$4"
Source_Dest=../../Source
 
#############################################################################
# How to get http
if test -x /usr/bin/wget; then
 #echo wget is found
 wgetBin='wget'
else
 #echo wget is NOT found
 if test -x /usr/bin/curl; then
  #echo Curl is found
  wgetBin='curl -O'
 else
  #echo Curl is NOT found, assuming default : wget
  wgetBin='wget'
 fi
fi

#############################################################################
# Go on the top level
test -e *.gz && rm *.gz
test -e *.bz2 && rm *.bz2

#############################################################################
# Preparing Directories
test -d $Source_Dest || mkdir -p $Source_Dest

#############################################################################
# ZLib
if test -d $Source_Dest/$Module; then
 echo $Module is already present
else
 test -e $File_Name$Method && rm $File_Name$Method
 $wgetBin $Web_Folder/$File_Name$Method
 if [ "$Method" = ".tar.gz" ]; then
  gunzip $File_Name.tar.gz
  tar xf $File_Name.tar
  rm $File_Name.tar
 fi
 if [ "$Method" = ".tar.bz2" ]; then
  bunzip2 $File_Name.tar.bz2
  tar xf $File_Name.tar
  rm $File_Name.tar
 fi
 test -d $Source_Dest/$Module && rm -r $Source_Dest/$Module
 mv $File_Name $Source_Dest/$Module
fi

}

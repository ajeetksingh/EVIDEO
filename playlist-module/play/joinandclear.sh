#!/bin/sh

cd $DIR
mencoder -fps 29.97 $PAR -o oa.flv -of lavf -ovc copy -oac copy
rm -rf $PAR
cd ..

#/bin/rm -rf $1
#/bin/rm -rf "$1#1"




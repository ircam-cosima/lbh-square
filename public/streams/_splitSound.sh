#!/usr/bin/env bash

echo $1

# get file without extension
filename=$(basename "$1")
# get extension
extension="${filename##*.}"
# remove extension
foldername="${filename%.*}"

# work only on wav
if [ ! "$extension" == "wav" ]; then
  echo "work only on wav files"
  exit 1
fi

# remove old files if need be
if [ -d "$foldername" ]; then
	rm -Rf $foldername
fi

# create directory
mkdir $foldername

# cut file in segments
ffmpeg -i "${filename}" -f segment -segment_time 10 -c copy "${foldername}"/%03d.wav

# convert segments in .mp3
for i in "${foldername}"/*.wav;
  do name=`echo $i | cut -d'.' -f1`;
  # echo $name;
  # ffmpeg -i "$i" "${name}.mov";
  lame "$i" "${name}.mp3"
  # remove wav after conversion
  rm "$i"
done

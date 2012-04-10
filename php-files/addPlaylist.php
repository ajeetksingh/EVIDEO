<?php

$id=$_GET['id'];
$title=$_GET['title'];
$start=$_GET['starttime'];
$stop=$_GET['stoptime'];
$play=$_GET['play'];
$user=$_GET['user'];
$url="http://evideo.iitj.ac.in:8080/play/$user"."_$play/oa.flv";
$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

mysql_query("INSERT INTO playlist(user_name, playlist_name,media_id, bookmark_title, start, stop) VALUES  ('$user', '$play', '$id', '$title', '$start', '$stop')");


mysql_close($con);
echo $url;
 //header( "Location: http://evideo.iitj.ac.in/engage/ui/watch.html?id=$txt" ) ;
?>

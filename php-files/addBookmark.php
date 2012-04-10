<?php

$id=$_GET['media_id'];
$title=$_GET['title'];





$start=$_GET['starttime'];
$stop=$_GET['stoptime'];
$user=$_GET['user'];
$description=$_GET['desc'];

$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

mysql_query("INSERT INTO bookmarks(media_id, user_name, start, stop, title, description) VALUES  ('$id', '$user', '$start', '$stop', '$title', '$description')");


mysql_close($con);
 //header( "Location: http://evideo.iitj.ac.in/engage/ui/watch.html?id=$txt" ) ;
?>

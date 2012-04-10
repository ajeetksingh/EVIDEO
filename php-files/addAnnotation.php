<?php

$id=$_GET['id'];
$title=$_GET['val'];





$start=$_GET['starttime'];
$stop=$_GET['stoptime'];
$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

mysql_query("INSERT INTO annotations(media_id, annotations, start, stop) VALUES  ('$id', '$title', '$start', '$stop')");


mysql_close($con);
 //header( "Location: http://evideo.iitj.ac.in/engage/ui/watch.html?id=$txt" ) ;
?>

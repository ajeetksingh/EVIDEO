<?php 
$mediaid=$_GET['media_id'];
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

$sql=mysql_query("update annotations set annotations='$title' where media_id='$mediaid' and id ='$id' and start='$start' and stop='$stop'"); 
?> 

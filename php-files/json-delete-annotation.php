<?php 
$mediaid=$_GET['media_id'];
$id=$_GET['id'];

$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

$sql=mysql_query("delete from annotations where media_id='$mediaid' and id =$id"); 
?> 

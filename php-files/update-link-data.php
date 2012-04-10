<?php 
$mediaid=$_GET['media_id'];
$id=$_GET['id'];
$title=$_GET['title'];
$url=$_GET['url'];
$description=$_GET['description'];
$start=$_GET['start'];
$stop=$_GET['stop'];
$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

mysql_query("UPDATE Link SET `title` = '$title',`url`='$url',`description`='$description',`start`='$start',`stop`='$stop' WHERE id='$id' and media_id='$mediaid'");
/*$response = array();
$row=mysql_fetch_array($sql) ;
$combo=$row['title'].'/'.$row['url'].'/'.$row['description'].'/'.$row['start'].'/'.$row['stop'];
echo $combo;*/
?> 

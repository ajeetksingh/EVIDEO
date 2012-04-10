<?php 
$id=$_GET['id'];

$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

$sql=mysql_query("select * from bookmarks where id =$id "); 
$row=mysql_fetch_array($sql);
 

$title=$row['title']; 


$start=$row['start'];
$stop=$row['stop'];
$media_id=$row['media_id'];

//$strval=$start.",".$stop.",".$title;
 
$response[] = array('start'=>$start, 'stop'=>$stop, 'title'=> $title, 'media_id'=> $media_id);
$data=json_encode($response);

echo $_GET['jsoncallback'] . '(' . $data . ');';
?> 

<?php 
$mediaid=$_GET['media_id'];
$id=$_GET['id'];

$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

$sql=mysql_query("select * from annotations where media_id='$mediaid' and id =$id "); 
$row=mysql_fetch_array($sql);
 

$title=$row['annotations']; 


$start=$row['start'];
$stop=$row['stop'];
//$strval=$start.",".$stop.",".$title;
 
$response[] = array('time'=>$start, 'title'=> $title, 'stop'=> $stop, 'titleid'=> $id);
$data=json_encode($response);

echo $_GET['jsoncallback'] . '(' . $data . ');';
?> 

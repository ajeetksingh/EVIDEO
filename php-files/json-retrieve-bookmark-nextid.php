<?php 
$id=$_GET['id'];
$user=$_GET['user'];
$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

$sql=mysql_query("select * from bookmarks where id in (SELECT min(id) AS id FROM bookmarks WHERE id > $id and user_name='$user')"); 
$row=mysql_fetch_array($sql);
 

$title=$row['title']; 


$start=$row['start'];
$stop=$row['stop'];
$media_id=$row['media_id'];
$bid=$row['id'];
//$strval=$start.",".$stop.",".$title;
 
$response[] = array('start'=>$start, 'stop'=>$stop, 'title'=> $title, 'media_id'=> $media_id, 'bid'=>$bid);
$data=json_encode($response);

echo $_GET['jsoncallback'] . '(' . $data . ');';
?> 

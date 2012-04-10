<?php 
$mediaid=$_GET['media_id'];
$id1=$_GET['id'];
//$mediaid='60a8e807-7657-44fe-8b0c-1cee84c1a0bb';
//$id1=''
$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

$sql=mysql_query("select title, url, description, start, stop from Link where id='$id1' and media_id='$mediaid'"); 
$response = array();
$row=mysql_fetch_array($sql) ;
//$titleId=$row['id'];
//$id=$row['media_id'];
$title=$row['title']; 
$url=$row['url'];
$description=$row['description'];
$start=$row['start'];
$stop=$row['stop'];
$response[] = array('title'=>$title, 'url'=> $url, 'description'=> $description, 'start'=> $start, 'stop'=> $stop);
$data=json_encode($response);
//echo $combo;
echo $_GET['jsoncallback'] . '(' . $data . ');';
?> 

<?php 
$username=$_GET['id'];

$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

$sql=mysql_query("select * from media_info where media_id='$username'"); 
$response = array();
while($row=mysql_fetch_array($sql)) 
{ 
$titleId=$row['id'];
$id=$row['media_id'];
$title=$row['media_name']; 
$media_creator=$row['media_creator'];

$start=$row['duration'];

$desc=$row['media_explanation'];
$response[] = array('start'=>$start, 'title'=> $title, 'media_id'=> $id, 'id'=> $titleId, 'desc'=>$desc, 'media_creator'=>$media_creator);// 'url'=> $url, 'description'=> $description, 'start'=>$start, 'stop'=>$stop);
} 

$data=json_encode($response);
//echo $data;
//$json_res = $info['data'];
echo $_GET['jsoncallback'] . '(' . $data . ');';
/*$fp = fopen('results.json', 'w')or die("can't open or create file".mysql_error());
fwrite($fp, json_encode($response));

fclose($fp);*/


?> 

<?php 
$username=$_GET['user'];

$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

$sql=mysql_query("select * from bookmarks where user_name='$username' group by id"); 
$response = array();
while($row=mysql_fetch_array($sql)) 
{ 
$titleId=$row['id'];
$id=$row['media_id'];
$title=$row['title']; 


$start=$row['start'];
$stop=$row['stop'];
$desc=$row['description'];
$response[] = array('start'=>$start, 'stop'=>$stop, 'title'=> $title, 'media_id'=> $id, 'id'=> $titleId, 'desc'=>$desc);// 'url'=> $url, 'description'=> $description, 'start'=>$start, 'stop'=>$stop);
} 

$data=json_encode($response);
//echo $data;
//$json_res = $info['data'];
echo $_GET['jsoncallback'] . '(' . $data . ');';
/*$fp = fopen('results.json', 'w')or die("can't open or create file".mysql_error());
fwrite($fp, json_encode($response));

fclose($fp);*/


?> 

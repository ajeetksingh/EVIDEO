<?php
$id=$_GET['id']; 
$time=$_GET['inp'];
$title=$_GET['val'];
$link = mysql_connect('localhost', 'root', '123');
if (!$link) {
    die('Could not connect: ' . mysql_error());
}


mysql_select_db("NPTEl_data") or die(mysql_error());
$sql=mysql_query("select * from vp_nptel where vid_id='$id'") or die(mysql_error());
$info = mysql_fetch_array( $sql ); 

$posts = array();



$string=$info['data'];


$json_a=json_decode($string,true);
$i=1;
foreach($json_a as $p)
{
if($time < $p["time"] && $i)
{
  $posts[] = array('time'=> $time, 'title'=> $title);
  $posts[] = array('time'=> $p["time"], 'title'=> $p["title"]);
  $i=0;
}
else
{
  $posts[] = array('time'=> $p["time"], 'title'=> $p["title"]);
}
}
if($i)
{
 $posts[] = array('time'=> $time, 'title'=> $title);
}
$result=json_encode($posts);

mysql_query("UPDATE vp_nptel SET `data` = '{$result}' WHERE vid_id='$id'");

mysql_close($con);
?> 

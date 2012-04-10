<?php

function formatTime($secs) {
   $times = array(3600, 60, 1);
   $time = '';
   $tmp = '';
   for($i = 0; $i < 3; $i++) {
      $tmp = floor($secs / $times[$i]);
      if($tmp < 1) {
         $tmp = '00';
      }
      elseif($tmp < 10) {
         $tmp = '0' . $tmp;
      }
      $time .= $tmp;
      if($i < 2) {
         $time .= ':';
      }
      $secs = $secs % $times[$i];
   }
   return $time;
}
$i=0;
$pname=$_GET['pname'];
$uname=$_GET['uname'];
$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }
$folder="$uname"."_$pname";
exec("mkdir $folder");
exec("mkdir $pname#1");
mysql_select_db("matterhorn", $con);

$sql=mysql_query("select * from playlist where playlist_name='$pname' and user_name='$uname'"); 

while($row=mysql_fetch_array($sql))
{
$media_id=$row['media_id'];
$start=$row['start'];
$stop=$row['stop'];
$diff=$stop-$start;

$starttime = formatTime($start);
$duration = formatTime($diff);

$cmd="sh trim.sh $media_id $starttime $duration $i";
exec($cmd);
exec("mv $i#trim.flv $pname#1");
exec("mv $i#trim1.flv $folder");
$i=$i+1;
}
$p=0;
$str="$p#trim1.flv"." ";
$p=$p+1;

while($p<$i)
{
$str=$str." "."$p#trim1.flv";
$p++;
}
exec("chmod 777 -R $folder");
exec("chmod 777 -R $pname#1");


$cmd="DIR=$folder PAR='$str' sh joinandclear.sh";
exec($cmd);

exec("zip -9 -r $pname.zip $folder");
exec("rm -rf $pname#1");
echo "<a  href='$pname.zip'>Download</a>";
?>

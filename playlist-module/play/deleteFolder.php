<?php

$uname=$_GET['user'];
echo $uname;
system("sh removePrev.sh $uname");
echo "deleted";
?>

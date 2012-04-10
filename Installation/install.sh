echo "welcome to Installation of Matterhorn. You should be login as root to install the matterhorn. You should have internet facility on the system."
read -p 'Do you have installed matterhorn previously:(Yes/No). Press 0 for exit:' ans
if [ $ans = 'Yes' -o $ans = 'yes' -o $ans = 'YES' -o $ans = 'y' -o $ans = 'Y' ]
then
   	rm -rf /opt/matterhorn
	echo "your previous installation have been removed. Run the command sh install.sh again"

elif [ $ans = '0' ]
then
   echo "Exiting matterhorn installation............"
else
	echo "creating the directory of matterhorn......"
   	mkdir -p /opt/matterhorn
	chown $USER:$GROUPS /opt/matterhorn

	echo "installing the subversion........"
	yum install subversion

	echo "checking matterhorn source......"
	svn checkout http://opencast.jira.com/svn/MH/tags/1.2.0 /opt/matterhorn/1.1.0

	svn checkout http://opencast.jira.com/svn/MH/tags/1.2.0 /opt/matterhorn/1.1.0

	

	echo "installing java......."
	yum install java-1.6.0
	
	echo "export JAVA_HOME=/usr/lib/jvm/java-1.6.0/" >> ~/.bashrc
	source ~/.bashrc
	
	echo "installing maven......."
	yum install maven2
	
	echo "installing felix....."
	#wget http://apache.mirrors.hoobly.com//felix/org.apache.felix.main.distribution-3.2.2.tar.gz
	tar xvf org.apache.felix.main.distribution-3.2.2.tar.gz
	
	mv felix-framework-3.2.2 /opt/matterhorn/felix
	mkdir /opt/matterhorn/felix/load
	cp -rf /opt/matterhorn/1.1.0/docs/felix/* /opt/matterhorn/felix/

	/bin/cp -f linux-compile /opt/matterhorn/1.1.0/docs/scripts/3rd_party/
	
	echo "building matterhorn........"
	
	export MAVEN_OPTS='-Xms256m -Xmx960m -XX:PermSize=64m -XX:MaxPermSize=256m'
	cd /opt/matterhorn/1.1.0
	mvn clean install -P admin -DdeployTo=/opt/matterhorn/felix/matterhorn
    	mvn clean install -P ingest -DdeployTo=/opt/matterhorn/felix/matterhorn
    	mvn clean install -P dist -DdeployTo=/opt/matterhorn/felix/matterhorn
    	mvn clean install -P engage -DdeployTo=/opt/matterhorn/felix/matterhorn
    	mvn clean install -P worker,workspace,serviceregistry -DdeployTo=/opt/matterhorn/felix/matterhorn
    	mvn clean install -P capture -DdeployTo=/opt/matterhorn/felix/matterhorn
	
	

	echo "installing the 3rd party tools............"
	rpm -Uvh http://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-stable.noarch.rpm http://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-stable.noarch.rpm
	yum install ffmpeg ffmpeg-devel
	cd /opt/matterhorn/1.1.0/docs/scripts/3rd_party
	./menu3p


	echo "installing red5 streaming server......."
	cd /opt/matterhorn
	wget -O red5-1.0.0-RC1.tar.gz http://trac.red5.org/downloads/1_0/red5-1.0.0-RC1.tar.gz
	tar -xzf red5-1.0.0-RC1.tar.gz
	ln -s red5-1.0.0 red5
	
	mkdir /opt/matterhorn/contrib
	cd /opt/matterhorn/contrib
	svn checkout http://opencast.jira.com/svn/MH/contrib/matterhorn-engage-streaming

	
	export RED5_HOME=/opt/matterhorn/red5
	cd /opt/matterhorn/contrib/matterhorn-engage-streaming
	ant
	
	cp /opt/matterhorn/contrib/matterhorn-engage-streaming/dist/*.war /opt/matterhorn/red5/webapps/
	mkdir -p /opt/matterhorn/felix/work/opencast/streams
	mkdir -p /opt/matterhorn/red5/webapps/matterhorn
	sudo rm -rf /opt/matterhorn/red5/webapps/matterhorn/streams
	sudo ln -s /opt/matterhorn/felix/work/opencast/streams /opt/matterhorn/red5/webapps/matterhorn/streams

	echo "configuring re5 with matterhorn......."
	echo -e "Open another terminal.Switch to root \nRun command: vi /opt/matterhorn/felix/conf/config.properties"

	echo -e "edit the following:\norg.opencastproject.streaming.url=rtmp://localhost/matterhorn-engage\norg.opencastproject.streaming.directory=/opt/matterhorn/red5/webapps/matterhorn/streams"
	
	read -p 'after editing press any key to continue.....' answ
	
	
		
		
		echo -e "installing mysql and mysql server....when asked for password..then if you have the mysql preinstalled on system the enter that password else just hit enter\nThen change the password and set it to opencast"
		yum remove mysql
		yum remove mysql-libs
		yum remove compat-mysql51
		yum install mysql mysql-server mysql-workbench
		service mysqld start
		mysql_secure_installation
		echo -e "Starting mysql............\nWhen asked enter password: opencast\nRun the following commands:\nCREATE DATABASE matterhorn CHARACTER SET utf8 COLLATE utf8_general_ci;\nGRANT SELECT,INSERT,UPDATE,DELETE,CREATE,DROP ON matterhorn.* TO 'matter_client'@'localhost' IDENTIFIED BY 'opencast';\nFor exiting from mysql type : exit"
		mysql -u root -p
	
		echo "now configuring mysql with matterhorn..........."
		echo -e "Open another terminal. Switch to root \nRun command: vi /opt/matterhorn/felix/conf/config.properties"

		echo -e "edit the following:\norg.opencastproject.db.ddl.generation=false
org.opencastproject.db.vendor=MySQL
org.opencastproject.db.jdbc.driver=com.mysql.jdbc.Driver
org.opencastproject.db.jdbc.url=jdbc:mysql://localhost:3306/matterhorn
org.opencastproject.db.jdbc.user=matter_client
org.opencastproject.db.jdbc.pass=opencast"

		read -p 'after editing press any key to continue.....' answ
		
		

			echo  -e "starting mysql...........when asked use password:opencast\nCreating database for matterhorn. For this run the following command in mysql prompt:\nuse matterhorn\nsource /opt/matterhorn/1.1.0/docs/scripts/ddl/mysql5.sql\nFor exit type exit"
			mysql -u root -p
			echo "now starting matterhorn.......to check browse http://localhost:8080 ater matterhorn started completely"
			service mysqld start
			echo -e "Starting red5 server....after that you open another terminal, switch to root and start the matterhorn using following command:\n sh /opt/matterhorn/felix/bin/start_matterhorn.sh"
			read -p 'starting red5 server press any key to continue.....' answ
			cd /opt/matterhorn/red5
			./red5.sh
			
		
	
       
fi




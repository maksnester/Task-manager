# Task-manager
Free task manager with several features:  
 *	Projects and tasks
 *	Project sharing (you can grant access with restrictions by roles)
 *	Task delegating
 *	Task attachments
 *	Email notifications (when task is assigned)
 *	Time tracking on tasks. Available time statistics:
   - Project summary
   - Member of project summary
   - Task summary
   - Detailed labels on timeline
     
Based on [node.js](https://nodejs.org/), [mongodb](https://www.mongodb.org/) and [bootstrap](http://getbootstrap.com/) for client side.  
Created as a student project.
## Installation
Expected that you have installed Node.js, npm, mongodb (somewhere).  
Check config file (config/config.json) for setting web-server port, mognodb connection url, email notification options, cookies etc.  
For linux systems you also should replace one word inside package.json. In string `"start": "set NODE_PATH=.; && node server.js --harmony"` replace `set` with `export`.  
The sequence of setup commands:
```
git clone https://github.com/Alendorff/Task-manager.git
cd Task-manager
npm i
cd app
npm i -g bower
bower i
cd ../
npm start
```
If everything ok - you will get console message like:
```
> Server is running on port 8080
> Connected to db successfully
```
## Demonstration
#### Signin and signup pages
![signup signin](https://cloud.githubusercontent.com/assets/4989157/8274572/2d146786-18e0-11e5-9935-af191984a077.png)
Social buttons not working yet...
#### Projects list
![Projects list](https://cloud.githubusercontent.com/assets/4989157/8274845/00e78d6e-18e5-11e5-9f7c-6dc530dc8732.png)
#### Project members
![members](https://cloud.githubusercontent.com/assets/4989157/8274574/2d16ba4a-18e0-11e5-9620-8512a78a6eb6.png)
#### Tasks
![Tasks](https://cloud.githubusercontent.com/assets/4989157/8274846/00ec952a-18e5-11e5-810f-a50f4468b967.png)  
Sorting available. On the next screen lists collapsed, not empty.
#### Timeline
![Timeline](https://cloud.githubusercontent.com/assets/4989157/8274575/2d186002-18e0-11e5-9956-b809ae97b01d.png)  
Titles of tasks can be displayed when hover. Timeline allows zooming and moving, based on [vis.js](http://visjs.org/)  
#### Task modal
![Task modal](https://cloud.githubusercontent.com/assets/4989157/8274847/00ed4060-18e5-11e5-985e-551e5bbfe0bf.png)
#### Timespent format
![Timespent](https://cloud.githubusercontent.com/assets/4989157/8274578/2d4a22fe-18e0-11e5-949d-a8a114fee5ae.png)  
A modal window displays when you click on the timestamp task.  

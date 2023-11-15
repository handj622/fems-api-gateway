# FEMS FCS API
A RESTful API for FEMS Database with Node Express
---

## Installation & Run
```bash
git clone {project URL}
cd fems-api-gateway
yarn install
yarn run dev

API Endpoint : http://127.0.0.1:3000
```


Before running API server, you should set the .env file with yours or set the your .env with my values on [.env]
```
# DB Configurations
DB_HOST=localhost
DB_PORT=3306
DB_USER=db_username
DB_PASS=db_password
DB_DATABASE=db_name

# local runtime configs
PORT=3000
SECRET_JWT=supersecret
```

If you want use API, you must input JWT Token on Bearer Token Type on Auth

### API
---
- user
- cluster
- service
- package

### 1. users
---
#### /api/v1/users
* `GET` : Get all Users
* `POST` : Create a new User
#### /api/v1/users/id/:{id}
* `GET` : Get a User [Id]
* `PATCH` : Update a User
* `DELETE` : Delete a User
#### /api/v1/users/name/:{id}
* `GET` : Get a User [Name]
#### /api/v1/users/whoami
* `GET` : Get a Login User
#### /api/v1/users/id/status/:{id}
* `PATCH` : Change User Account Status
#### /api/v1/users/login
* `GET` : Login with Get JWT Token

### 2. cluster
---
#### /fcsapi/v1/cluster
* `GET` : Get all Clusters
* `POST` : Create a new Cluster
#### /fcsapi/v1/cluster/:{clusterCode}
* `PATCH` : Update One Cluster Data
* `DELETE` : DELETE One Cluster Data
#### /fcsapi/v1/cluster/clusterCode/:{clusterCode}
* `GET` : Get One Cluster Data
#### /fcsapi/v1/cluster/monitoring
* `GET` : Get Cluster Monitoring Data

### 3. services
---
#### /fcsapi/v1/services
* `GET` : Get all Services
#### /fcsapi/v1/services/service_id/:{service_id}
* `GET` : Get One Service Data
#### /fcsapi/v1/services/monitoring
* `GET` : Get Service Monitoring Data

### 4. packages
---
#### /fcsapi/v1/packages
* `GET` : Get all Packages
* `POST` : Deploy a new Package
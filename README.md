# Epitech Intra Scrapper

## Description
This project is in two parts:
- A Discord bot (Using discord.js) that push notifications and updates to a Discord channel
- TypeScript files that scrap the Epitech intranet and send the data to the database (Using house made ORM [see](./src/sql/connector.ts))

## Installation
- Clone the repository
- Install dependencies with `npm install`
- Create a `.env` file at the root of the project and add the following variables:
```env
DB_HOST="***.***.***.***" # IP of the database
DB_PORT="****" # Port of the database
DB_USER="*********" # Username of the database
DB_NAME="*********" # Name of the database
DB_PASSWORD="***********" # Password of the database
DISCORD_TOKEN=******************************** # Discord bot token
DISCORD_CLIENT_ID=******************************** # Discord bot client id
DISCORD_GUILD_ID=******************************** # Discord guild id (server id where the bot is)
DISCORD_UPDATE_CHANNEL_ID=******************************** # Discord channel id where the bot will send updates
DISCORD_DEV_CHANNEL_ID=******************************** # Discord channel id where the bot will send errors or debug messages
```
- Run the bot with `npm run start`, if you want to run it development mode, use `export NODE_ENV=development` before running the bot

## Setting up the database
- Create a database with the name you set in the `.env` file
- Create following tables:
### `source_users`
```sql
create table source_users
(
    name            varchar(255)         not null,
    cookie          text                 null,
    year            year                 null,
    promo           varchar(5)           not null,
    discord_user_id varchar(255)         not null primary key,
    disabled        tinyint(1) default 0 not null,
    constraint source_users_pk2
        unique (name)
);
```

### `modules`
```sql
create table modules
(
    id                   bigint                                        not null primary key,
    name                 text                                          not null,
    name_full            text                                          not null,
    code                 varchar(9)                                    not null,
    semester             int                                           not null,
    year                 year                                          not null,
    city                 varchar(255)                                  not null,
    credits              int        default 0                          not null,
    is_ongoing           tinyint(1) default 0                          not null,
    start                date                                          not null,
    end                  date                                          not null,
    is_registration_open tinyint(1) default 0                          not null,
    end_registration     date                                          null,
    is_mandatory         tinyint(1) default 0                          not null,
    is_roadblock         tinyint(1) default 0                          not null,
    url                  text       default 'https://intra.epitech.eu' not null,
    promo                varchar(5)                                    not null
);
```

### `activities`
```sql
create table activities
(
    id           varchar(255)                                  not null
        primary key,
    module_id    bigint                                        not null,
    name         text                                          not null,
    is_ongoing   tinyint(1) default 0                          not null,
    start        datetime                                      not null,
    end          datetime                                      not null,
    location     text                                          null,
    description  text                                          null,
    is_project   tinyint(1) default 0                          not null,
    is_graded    tinyint(1) default 0                          not null,
    has_meeting  tinyint(1) default 0                          not null,
    url          text       default 'https://intra.epitech.eu' not null,
    deadline     datetime                                      null,
    begin        datetime                                      not null,
    end_register datetime                                      null,
    type         text                                          not null,
    main_type    text                                          not null,
    constraint activities_modules_id_fk
        foreign key (module_id) references modules (id)
            on update cascade on delete cascade
);
```
### `rooms`
```sql
create table rooms
(
    id            varchar(255)           not null
        primary key,
    activity_id   varchar(255)           not null,
    start         datetime               not null,
    end           datetime               not null,
    room          text default 'No Room' null,
    session_index int  default 0         not null,
    constraint rooms_activities_id_fk
        foreign key (activity_id) references activities (id)
);
```

Don't forget to add your user to the database with the following command:
```sql
CREATE USER 'username'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'username'@'%';
```
#### Some warnings
- Update the 'username' and 'password' with your own
- Don't forget to change the '%' to 'localhost' if you want to run the bot on the same machine as the database
- Don't forget to change the '%' to the IP of the machine that will run the bot if you want to run the bot on another machine than the database
- GRANT ALL PRIVILEGES is not recommended, you should only grant the privileges you need

## Usage
- Run the bot with `npm run start`, if you want to run it development mode, use `export NODE_ENV=development` before running the bot
- Invite the bot to your server with the following link: `https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=8` (Replace CLIENT_ID with your bot client id)
- Use slash commands to interact with the bot


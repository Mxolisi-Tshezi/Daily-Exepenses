create database trackdb;
create role expenser login password 'expenser123';
grant all privileges on database trackdb to expenser;
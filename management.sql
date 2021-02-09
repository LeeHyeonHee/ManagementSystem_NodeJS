-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- 생성 시간: 19-05-23 07:11
-- 서버 버전: 10.1.40-MariaDB
-- PHP 버전: 7.3.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 데이터베이스: `management`
--

-- --------------------------------------------------------

--
-- 테이블 구조 `application`
--

CREATE TABLE `application` (
  `appNo` int(11) NOT NULL,
  `appName` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 테이블의 덤프 데이터 `application`
--

INSERT INTO `application` (`appNo`, `appName`) VALUES
(1, '한글과컴퓨터'),
(2, '오피스'),
(3, '포토샵'),
(4, '카카오톡'),
(5, 'node.js');

-- --------------------------------------------------------

--
-- 테이블 구조 `authority`
--

CREATE TABLE `authority` (
  `authNo` int(15) NOT NULL,
  `id` varchar(15) DEFAULT NULL,
  `departNum` varchar(5) DEFAULT NULL,
  `appNo` int(11) NOT NULL,
  `authDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 테이블의 덤프 데이터 `authority`
--

INSERT INTO `authority` (`authNo`, `id`, `departNum`, `appNo`, `authDate`) VALUES
(24, 'test1', NULL, 1, '2019-04-30 15:00:00'),
(26, NULL, 'D3', 1, '2019-05-15 15:00:00'),
(28, NULL, 'D0', 1, '2019-05-19 15:00:00'),
(29, NULL, 'D1', 1, '2019-05-12 15:00:00'),
(30, 'test1', NULL, 2, '2019-05-02 15:00:00'),
(31, 'test1', NULL, 3, '2019-05-03 15:00:00'),
(32, 'test1', NULL, 5, '2019-05-04 15:00:00'),
(33, 'Master', NULL, 1, '2019-05-22 06:17:13'),
(34, 'Master', NULL, 2, '2019-05-22 06:17:13'),
(35, 'Master', NULL, 3, '2019-05-22 06:17:33'),
(36, 'Master', NULL, 4, '2019-05-22 06:17:33'),
(37, 'Master', NULL, 5, '2019-05-22 06:17:41'),
(38, 'test3', NULL, 3, '2019-05-23 00:11:16'),
(40, 'test2', NULL, 2, '2019-05-23 01:07:14');

-- --------------------------------------------------------

--
-- 테이블 구조 `department`
--

CREATE TABLE `department` (
  `departNum` varchar(5) NOT NULL,
  `departName` varchar(10) NOT NULL,
  `office` varchar(20) NOT NULL,
  `comment` varchar(100) NOT NULL,
  `officePhone` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 테이블의 덤프 데이터 `department`
--

INSERT INTO `department` (`departNum`, `departName`, `office`, `comment`, `officePhone`) VALUES
('D0', '영업팀', '101', '영업을 하는 부서', '051-111-1111'),
('D1', '개발팀', '202', '회사운영에 필요한 소프트웨어를 개발하는 부서', '051-123-4567'),
('D2', '비서실', '405', '비서', '051-987-6543'),
('D3', '인사부', '205', '인사발령 및 급여처리를 담당하는 부서', '051-135-7913');

-- --------------------------------------------------------

--
-- 테이블 구조 `member`
--

CREATE TABLE `member` (
  `id` varchar(15) NOT NULL,
  `password` varchar(20) NOT NULL,
  `address` varchar(50) NOT NULL,
  `email` varchar(20) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `passwordTime` date DEFAULT NULL,
  `departNum` varchar(5) DEFAULT NULL,
  `name` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 테이블의 덤프 데이터 `member`
--

INSERT INTO `member` (`id`, `password`, `address`, `email`, `phone`, `passwordTime`, `departNum`, `name`) VALUES
('hyeon', 'hee', '부산시 주례동', 'ddrthca', '010-8181-8181', '2019-05-21', 'D0', '이현희'),
('Master', '1111', 'Master', 'Master', '00000000000', '2019-05-22', NULL, '관리자'),
('test1', '1234', '부산시 ', 'test@test', '111', '2019-05-21', 'D3', '김용진'),
('test2', '2', '서울시', 'aaa@aaa.aa.aa', '019-8090-8711', '2019-04-23', 'D1', '최다훈'),
('test3', '3', '3', '3', '3', '2019-05-16', NULL, '현희');

--
-- 덤프된 테이블의 인덱스
--

--
-- 테이블의 인덱스 `application`
--
ALTER TABLE `application`
  ADD PRIMARY KEY (`appNo`);

--
-- 테이블의 인덱스 `authority`
--
ALTER TABLE `authority`
  ADD PRIMARY KEY (`authNo`),
  ADD KEY `id` (`id`),
  ADD KEY `appNo` (`appNo`),
  ADD KEY `departNum` (`departNum`);

--
-- 테이블의 인덱스 `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`departNum`);

--
-- 테이블의 인덱스 `member`
--
ALTER TABLE `member`
  ADD PRIMARY KEY (`id`),
  ADD KEY `departNum` (`departNum`);

--
-- 덤프된 테이블의 AUTO_INCREMENT
--

--
-- 테이블의 AUTO_INCREMENT `application`
--
ALTER TABLE `application`
  MODIFY `appNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 테이블의 AUTO_INCREMENT `authority`
--
ALTER TABLE `authority`
  MODIFY `authNo` int(15) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- 덤프된 테이블의 제약사항
--

--
-- 테이블의 제약사항 `authority`
--
ALTER TABLE `authority`
  ADD CONSTRAINT `authority_ibfk_1` FOREIGN KEY (`id`) REFERENCES `member` (`id`),
  ADD CONSTRAINT `authority_ibfk_2` FOREIGN KEY (`appNo`) REFERENCES `application` (`appNo`),
  ADD CONSTRAINT `authority_ibfk_3` FOREIGN KEY (`appNo`) REFERENCES `application` (`appNo`),
  ADD CONSTRAINT `authority_ibfk_4` FOREIGN KEY (`appNo`) REFERENCES `application` (`appNo`),
  ADD CONSTRAINT `authority_ibfk_5` FOREIGN KEY (`appNo`) REFERENCES `application` (`appNo`),
  ADD CONSTRAINT `authority_ibfk_6` FOREIGN KEY (`appNo`) REFERENCES `application` (`appNo`),
  ADD CONSTRAINT `authority_ibfk_7` FOREIGN KEY (`departNum`) REFERENCES `department` (`departNum`);

--
-- 테이블의 제약사항 `member`
--
ALTER TABLE `member`
  ADD CONSTRAINT `member_ibfk_1` FOREIGN KEY (`departNum`) REFERENCES `department` (`departNum`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

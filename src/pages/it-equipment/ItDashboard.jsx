import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { Card, Row, Col, Table, Badge, Button, Form } from 'react-bootstrap';
import { FaLaptopCode, FaArrowDown, FaArrowUp, FaServer, FaKeyboard, FaMouse, FaBoxOpen, FaPlus, FaTrash, FaPrint, FaSave, FaSignOutAlt, FaFileExcel } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { decryptData } from '../../utils/encryption';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const departmentMapping = {
  "i037": "Call Center 1/1 อาคาร 1",
  "i266": "Lab OPD Fast Track อาคาร 3",
  "i168": "Lab เคมีคลีนิค (CHEME) 10/2 อาคาร 10",
  "i041": "Lab จุลชีววิทยา 10/2 อาคาร 10",
  "i336": "Lab เจาะเลือด ( ศูนย์มะเร็ง) ชั้น 2 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i010": "Lab เจาะเลือดและรับสิ่งส่งตรวจ #12 6/1 อาคาร 6",
  "i307": "Lab เจาะเลือดและรับสิ่งส่งตรวจ 10/2 อาคาร 10",
  "i042": "Lab เชลล์วิทยา 10/2 อาคาร 19 (คลังพัสดุ)",
  "i081": "Lab ธนาคารเลือด 10/2 อาคาร 10",
  "i043": "Lab ภูมิคุ้มกัน (Immono) 10/2 อาคาร 10",
  "i177": "Lab รพ.ราชวิถีนครพิงค์ รพ.ราชวิถีนครพิงค์",
  "i044": "Lab โลหิตวิทยา (Hemato) 10/2 อาคาร 10",
  "i337": "Lab ศูนย์มะเร็ง ชั้น 2 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i360": "Lab ห้องเจาะเลือด อาคาร 3 ชั้น1 อาคาร 3",
  "i352": "OPD Covid19 2/1 อาคาร 2",
  "i354": "OPD ARI 2/1 อาคาร 2",
  "i046": "OPD Fast Track 3/4 อาคาร 3",
  "i003": "OPD URO 3/1 อาคาร 3",
  "i348": "OPD กายภาพ (ศูนย์สุขภาพชุมชนเมือง) ชั้น 3 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์สุขภาพชุมชนเมือง",
  "i233": "OPD กายภาพบำบัด 15 อาคาร 15",
  "i151": "OPD กายอุปกรณ์ 15 อาคาร 15",
  "i349": "OPD กิจกรรมบำบัด (ศูนย์สุขภาพชุมชนเมือง) ชั้น 3 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์สุขภาพชุมชนเมือง",
  "i063": "OPD กิจกรรมบำบัด 15 อาคาร 15",
  "i050": "OPD กุมารเวชกรรม 3/2 อาคาร 3",
  "i369": "OPD คลินิกรูปแบบพิเศษพรีเมี่ยม (Premium Clinic) อาคาร 7",
  "i357": "OPD คลื่นไฟฟ้าสมอง (EEG) 3/2 อาคาร 3",
  "i049": "OPD จักษุ 3/4 อาคาร 3",
  "i079": "OPD จิตเวช 16/1 อาคาร 16",
  "i186": "OPD ตรวคลื่นหัวใจ (EKG) 3/3 อาคาร 3",
  "i295": "OPD ตรวจพิเศษหัวใจภายนอก (ECHO) 12/1 อาคาร 12",
  "i066": "OPD ตรวจสุขภาพ (ต่างด้าว 18) 8/1 อาคาร 8 (X-Ray คอมพิวเตอร์)",
  "i378": "OPD ไตเทียม (บริษัท) 3/3 อาคาร 3",
  "i190": "OPD ไตเทียม 11/1 อาคาร 11",
  "i160": "OPD ทรวงอก (28) 3/3 อาคาร 3",
  "i347": "OPD ทันตกรรม (ศูนย์สุขภาพชุมชนเมือง) ชั้น 2 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์สุขภาพชุมชนเมือง",
  "i011": "OPD ทันตกรรม 3/4 อาคาร 3",
  "i280": "OPD ทันตกรรม รพ.ราชวิถีนครพิงค์ รพ.ราชวิถีนครพิงค์",
  "i279": "OPD นิติเวช (axe) 17/1 อาคาร 17 (นิติเวช)",
  "i320": "OPD ประคับประคอง(กัญชา) 3/2 อาคาร 3",
  "i346": "OPD ผู้สูงอายุ (ศูนย์สุขภาพชุมชนเมือง) ชั้น 2 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์สุขภาพชุมชนเมือง",
  "i084": "OPD ฝากครรภ์ (ANC) 3/2 อาคาร 3",
  "i254": "OPD พิเศษอายุกรรม M360 3/3 อาคาร 3",
  "i350": "OPD แพทย์แผนไทย (ศูนย์สุขภาพชุมชนเมือง) ชั้น 3 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์สุขภาพชุมชนเมือง",
  "i094": "OPD แพทย์แผนไทยและการแพทย์ทางเลือก 5/1 อาคาร 5",
  "i174": "OPD รพ.ราชวิถีนครพิงค์ รพ.ราชวิถีนครพิงค์",
  "i327": "OPD รังสีรักษาและเคมีบำบัด ชั้น 1 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i253": "OPD โรคทั่วไป (PCU 13) 3/4 อาคาร 3",
  "i252": "OPD โรคเรื้อรัง M370 3/3 อาคาร 3",
  "i002": "OPD วัณโรค(TB) 4/1 อาคารสันทนาการ",
  "i308": "OPD เวชศาสตร์ครอบครัว ชั้น1 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์สุขภาพชุมชนเมือง",
  "i272": "OPD ศัลยกรรม 3/1 อาคาร 3",
  "i048": "OPD ศัลยกรรมกระดูกและข้อ 1/1 อาคาร 1",
  "i144": "OPD ศูนย์สลายนิ่ว 1/4 อาคาร 1",
  "i239": "OPD สวนหัวใจ (Cath Lab) 12/1 อาคาร 12",
  "i133": "OPD ส่องกระเพาะ 6/2 (งานตรวจพิเศษ) อาคาร 6",
  "i053": "OPD สูตินรีเวชกรรม 3/2 อาคาร 3",
  "i251": "OPD หู คอ จมูก (ENT) 3/4 อาคาร 3",
  "i069": "OPD อาชีวเวชกรรม 5/1 อาคาร 5",
  "i162": "OPD อายุรกรรม M380 3/3 อาคาร 3",
  "i009": "X-Ray 10/1 อาคาร 10",
  "i263": "X-Ray ER 1/1 อาคาร 1",
  "i262": "X-Ray OPD 3/2 อาคาร 3",
  "i170": "X-Ray ศูนย์มะเร็ง (ชุมชนเมือง) ชั้น 1 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์สุขภาพชุมชนเมือง",
  "i158": "กลุ่มงานการเงิน 3/5 อาคาร 3",
  "i318": "กลุ่มงานการพยาบาลชุมชน 22/2 อาคาร 22 (ซักฟอก)",
  "i345": "กลุ่มงานโครงสร้างพื้นฐานและวิศวกรรมการแพทย์ (ศูนย์มะเร็ง) ชั้น 6 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i157": "กลุ่มงานโครงสร้างพื้นฐานและวิศวกรรมการแพทย์ 24 อาคาร 24 (ซ่อมบำรุง)",
  "i062": "กลุ่มงานทรัพยากรบุคคล 3/5 อาคาร 3",
  "i182": "กลุ่มงานเทคโนโลยีสารสนเทศ (IT) 3/6 อาคาร 3",
  "i344": "กลุ่มงานเทคโนโลยีสารสนเทศ (ศูนย์มะเร็ง) ชั้น 6 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i109": "กลุ่มงานประกันสุขภาพ 3/G อาคาร 3",
  "i204": "กลุ่มงานพยาธิวิทยาคลินิก 19/2 อาคาร 19 (คลังพัสดุ)",
  "i163": "กลุ่มงานพัฒนาคุณภาพบริการและมาตรฐาน 3/7 อาคาร 3",
  "i086": "กลุ่มงานพัฒนาทรัพยากรบุคคล 3/7 อาคาร 3",
  "i095": "กลุ่มงานโภชนศาสตร์ 20/1 อาคาร 20 (โภชนาการ)",
  "i231": "กลุ่มงานยุทธศาสตร์และแผนงานโครงการ 3/6 อาคาร 3",
  "i351": "กลุ่มงานเวชกรรมสังคม (ศูนย์สุขภาพชุมชนเมือง) ชั้น 4 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์สุขภาพชุมชนเมือง",
  "i101": "กลุ่มงานเวชกรรมสังคม 22/2 อาคาร 22 (ซักฟอก)",
  "i331": "กลุ่มงานเวชระเบียนและข้อมูลทางการแพทย์ (ศูนย์มะเร็ง) ชั้น 1 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i058": "กลุ่มงานเวชระเบียนและข้อมูลทางการแพทย์ 1/1 อาคาร 1",
  "i184": "กลุ่มงานเวชระเบียนและข้อมูลทางการแพทย์ 3/1 อาคาร 3",
  "i175": "กลุ่มงานเวชระเบียนและข้อมูลทางการแพทย์ รพ.ราชวิถีนครพิงค์ รพ.ราชวิถีนครพิงค์",
  "i367": "กลุ่มงานสุขภาพดิจิทัล อาคาร 3",
  "i323": "กลุ่มงานสุขศึกษา 3/G อาคาร 3",
  "i136": "กลุ่มงานอาชีวเวชกรรม 21/2 อาคาร 21 (จ่ายกลาง)",
  "i332": "การเงิน (ศูนย์มะเร็ง) ชั้น 1 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i208": "การเงิน Lab เจาะเลือด เบอร์ 12 7/1 อาคาร 7",
  "i060": "การเงิน ผู้ป่วยใน 5/2 อาคาร 5",
  "i061": "การเงิน ผู้ป่วยใน 2 16/2 อาคาร 16",
  "i281": "การเงิน รพ.ราชวิถีนครพิงค์ รพ.ราชวิถีนครพิงค์",
  "i057": "การเงิน อาคารอุบัติเหตุเบอร์ 101 1/1 อาคาร 1",
  "i059": "การเงินผู้ป่วยนอก 1 3/1 อาคาร 3",
  "i055": "การเงินผู้ป่วยนอก 2 3/3 อาคาร 3",
  "i087": "คลังพัสดุ 19/1 อาคาร 19 (คลังพัสดุ)",
  "i240": "คลินิคทำแผลกดทับและออสโตมี 2/1 อาคาร 2",
  "i237": "คลินิคนมแม่ 12/3 อาคาร 12",
  "i358": "เครื่องสำรองที่ไม่ได้ใช้งาน อาคาร 3",
  "i366": "งาน PG 12/4 อาคาร 12",
  "i326": "งานกุมาเวชกรรมเติมเลือด (Pediatrics One Day Service) 3/1 อาคาร 3",
  "i065": "งานคลังยา 7/2 อาคาร 7",
  "i070": "งานควบคุมและป้องกันการติดเชื้อในโรงพยาบาล 3/7 อาคาร 3",
  "i074": "งานจ่ายกลาง 21 อาคาร 21 (จ่ายกลาง)",
  "i355": "งานจ่ายยาไปรษณีย์ 3/3 อาคาร 3",
  "i072": "งานซักฟอก 22 อาคาร 22 (ซักฟอก)",
  "i381": "งานตรวจสอบสิทธิ์ 3/1 อาคาร 3",
  "i343": "งานทะเบียนมะเร็ง ชั้น 6 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i296": "งานธุรการ (พ่อบ้าน) 3/5 อาคาร 3",
  "i082": "งานธุรการ 3/5 อาคาร 3",
  "i297": "งานนิติกร (lawyer) 3/5 อาคาร 3",
  "i036": "งานบริการเภสัขกรรมผู้ป่วยใน(Acute Care) 7/1 อาคาร 7",
  "i316": "งานป้องกันควบคุมโรคและระบาดวิทยา (สันทนาการ) อาคารสันทนาการ",
  "i064": "งานผลิตยา 7/1 อาคาร 7",
  "i339": "งานผู้ป่วยนอกเคมีบำบัด ชั้น 2 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i356": "งานเภสัชกรรมปฐมภูมิ อาคาร 3",
  "i232": "งานยานพาหนะ อาคารศูนย์ยาพาหนะ",
  "i096": "งานโยธา 3/5 อาคาร 3",
  "i119": "งานรักษาความปลอดภัย อาคารรักษาความปลอดภัย",
  "i302": "งานรักษาศพ 18 อาคาร 18 (รักษาศพ)",
  "i365": "งานวิจัย 3/7 อาคาร 3",
  "i100": "งานวิสัญญี1 1/2 อาคาร 1",
  "i303": "งานวิสัญญี2 10/3 อาคาร 10",
  "i259": "งานเวชนิทัศน์ 3/6 อาคาร 3",
  "i102": "งานเวชนิทัศน์ 3/7 อาคาร 3",
  "i382": "งานส่งเสริมสุขภาพและฟื้นฟู ชั้น 2 (ก.เวชกรรมสังคม) รพ.สาขาศูนย์มะเร็ง อาคารศูนย์สุขภาพชุมชนเมือง",
  "i152": "งานสนาม 27 อาคาร 27 (พักขยะ)",
  "i114": "งานสวัสดิการสังคม อาคาร 22 (ซักฟอก)",
  "i012": "งานสังคมสังเคราะห์เบอร์ 3/G อาคาร 3",
  "i118": "งานสุขาภิบาลสิ่งแวดล้อม 25 อาคาร 25 (บำบัดน้ำเสีย)",
  "i125": "งานห้องผ่าตัด (อุบัติเหตุ) 1/2 อาคาร 1",
  "i363": "งานห้องผ่าตัด รพ.ราชวิถีนครพิงค์ รพ.ราชวิถีนครพิงค์",
  "i304": "งานห้องผ่าตัด2 10/3 อาคาร 10",
  "i126": "งานห้องผ่าตัดเล็ก (OR เล็ก) 1/1 อาคาร 1",
  "i364": "งานห้องวิสัญญี รพ.ราชวิถีนครพิงค์ รพ.ราชวิถีนครพิงค์",
  "i139": "งานโอเปอร์เรเตอร์ 1/1 อาคาร 1",
  "i309": "จุดคัดกรอง (อาคาร OPD ชั้น 1) 3/1 อาคาร 3",
  "i312": "รพ.สต.ขอนตาล รพ.สต.",
  "i313": "รพ.สต.บ้านซาง รพ.สต.",
  "i311": "รพ.สต.บ้านวังป้อง รพ.สต.",
  "i315": "รพ.สต.บ้านสะลวงนอก รพ.สต.",
  "i314": "รพ.สต.บ้านใหม่ รพ.สต.",
  "i104": "ศูนย์ HIV 3/2 อาคาร 3",
  "i106": "ศูนย์เครื่องมือแพทย์ 16/1 อาคาร 16",
  "i149": "ศูนย์จองห้องพิเศษ 3/1 อาคาร 3",
  "i293": "ศูนย์จัดเก็บรายได้ (e-clam) 3/6 อาคาร 3",
  "i306": "ศูนย์เด็กเล็ก แฟลตพยาบาล (สีฟ้า)",
  "i368": "ศูนย์เทคโนโลยีสารสนเทศเพื่อเด็กป่วยตามแนวพระราชดำริ 12/2 อาคาร 12",
  "i107": "ศูนย์ประสานงาน PCU อาคาร 2",
  "i260": "ศูนย์เปล 1/1 อาคาร 1",
  "i361": "ศูนย์เปล 3/1 อาคาร 3",
  "i299": "ศูนย์แพทยศาสตรศึกษาชั้นคลีนิค 23 อาคาร 23 (ศูนย์แพทย์ศาสตร์ ชั้นคลินิก)",
  "i380": "ศูนย์รับบริจาคอวัยวะและดวงตา 11/2 ว่าง อาคาร 11",
  "i379": "ศูนย์รับบริจาคอวัยวะและดวงตา 11/2 อาคาร 11",
  "i112": "ศูนย์วิทยุ 1/1 อาคาร 1",
  "i257": "ศูนย์อนุม้ติสิทธิ์ fax-clam 3/G อาคาร 3",
  "i103": "สำนักงาน ems 1/1 อาคาร 1",
  "i207": "สำนักงาน กลุ่มการพยาบาล 3/5 อาคาร 3",
  "i209": "สำนักงาน กลุ่มงานเทคนิคการแพทย์ 10/2 อาคาร 10",
  "i120": "สำนักงาน ผู้อำนวยการ 3/5 อาคาร 3",
  "i255": "สำนักงาน พยาบาลผู้ป่วยนอก 3/2 อาคาร 3",
  "i134": "สำนักงาน แพทย์กุมารเวชกรรม 14/1 อาคาร 14",
  "i278": "สำนักงาน แพทย์ศัลยกรรม 16/1 อาคาร 16",
  "i377": "สำนักงาน แพทย์ศัลยกรรม 3/6 อาคาร 3",
  "i268": "สำนักงาน แพทย์ศัลยกรรมกระดูก 1/1 อาคาร 1",
  "i300": "สำนักงาน แพทย์สูติ-นรีเวชกรรม 10/4 อาคาร 10",
  "i183": "สำนักงาน แพทย์อายุรกรรม 5/2 อาคาร 5",
  "i097": "สำนักงาน รองบริหาร 3/5 อาคาร 3",
  "i121": "สำนักงาน รองแพทย์ 3/5 อาคาร 3",
  "i128": "สำนักงาน ห้องพักแพทย์ 3/6 อาคาร 3",
  "i154": "สำนักงานตรวจสอบภายใน 3/4 อาคาร 3",
  "i083": "สำนักงานบัญชี 3/5 อาคาร 3",
  "i088": "สำนักงานพัสดุ 3/5 อาคาร 3",
  "i342": "สำนักงานแพทย์ (ศูนย์มะเร็ง) ชั้น 6 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i013": "สำนักงานเภสัชกรรม 3/6 อาคาร 3",
  "i159": "สำนักงานเภสัชสนเทศ (DIS) 3/2 อาคาร 3",
  "i277": "หน่วยมะเร็งและหน่วยเคมีบำบัด รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i328": "หน่วยให้ยาเคมีบำบัด (Oneday chemotherapy unit) ชั้น3 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i362": "ห้อง MRI 10/1 (ต่อเติม) อาคาร 10",
  "i014": "ห้องคลอด 10/4 อาคาร 10",
  "i261": "ห้องจ่ายยา ER 1/1 อาคาร 1",
  "i267": "ห้องจ่ายยา Fast Track อาคาร 3",
  "i173": "ห้องจ่ายยา รพ.ราชวิถีนครพิงค์ รพ.ราชวิถีนครพิงค์",
  "i078": "ห้องจ่ายยาเด็ก (ตูบ) เบอร์ 31 อาคาร 3",
  "i161": "ห้องจ่ายยาเบอร์ 11 อาคาร 3",
  "i333": "ห้องจ่ายยาผู้ป่วยนอก (ศูนย์มะเร็ง) ชั้น 1 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i321": "ห้องจ่ายยาผู้ป่วยนอก 1 3/3 อาคาร 3",
  "i015": "ห้องจ่ายยาผู้ป่วยนอก 3/G อาคาร 3",
  "i334": "ห้องจ่ายยาผู้ป่วยใน (ศูนย์มะเร็ง) ชั้น 1 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i289": "ห้องจ่ายยาผู้ป่วยใน 3 (16/2) อาคาร 16",
  "i282": "ห้องจ่ายยาผู้ป่วยใน 5/2 อาคาร 5",
  "i131": "ห้องจ่ายยาผู้ป่วยใน 6/2 อาคาร 12",
  "i264": "ห้องฉีดยา-ทำแผล เบอร์ 113 อาคาร 1",
  "i166": "ห้องฉุกเฉิน (ER) 1/1 อาคาร 1",
  "i340": "ห้องเตรียมยาเคมีบำบัด ชั้น 3 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i375": "ห้องนอนเวรแพทย์อายุรกรรม 16/5 อาคาร 16",
  "i169": "ห้องผู้ตรวจการพยาบาล 9/2 อาคาร 9",
  "i372": "ห้องพักแพทย์เวรศัลยกรรม 11/8 อาคาร 11",
  "i376": "ห้องวิจัยพยาบาล 9/2 อาคาร 9",
  "i132": "ห้องสมุด 23/G อาคาร 23 (ศูนย์แพทย์ศาสตร์ ชั้นคลินิก)",
  "i335": "ห้องสังเกตอาการ ( ศูนย์มะเร็ง) ชั้น 1 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i165": "ห้องสังเกตุอาการ 1/1 อาคาร 1",
  "i156": "ห้องอบรมคอมพิวเตอร์ 3/6 อาคาร 3",
  "i338": "หอผู้ป่วย palliative care และ ชีวาภิบาล ชั้น 2 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i322": "หอผู้ป่วยกึ่งวิกฤตอายุรกรรม Semi-ICU 16/5 อาคาร 16",
  "i093": "หอผู้ป่วยพิเศษ 1/4 อาคาร 1",
  "i089": "หอผู้ป่วยพิเศษ 11/8 อาคาร 11",
  "i235": "หอผู้ป่วยพิเศษ 12/4 อาคาร 12",
  "i236": "หอผู้ป่วยพิเศษ 12/5 อาคาร 12",
  "i310": "หอผู้ป่วยพิเศษ 13/4 อาคาร 13",
  "i242": "หอผู้ป่วยพิเศษ 13/5 อาคาร 13",
  "i171": "หอผู้ป่วยพิเศษ 16/6 อาคาร 16",
  "i353": "หอผู้ป่วยพิเศษ 9/1 อาคาร 9",
  "i143": "หอผู้ป่วยพิเศษ 9/2 อาคาร 9",
  "i090": "หอผู้ป่วยพิเศษ 9/4 อาคาร 9",
  "i383": "หอผู้ป่วยพิเศษกุมารเวชกรรม 12/5 อาคาร 12",
  "i341": "หอผู้ป่วยพิเศษรังสีรักษาและเคมีบำบัด 1 ชั้น 4 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i330": "หอผู้ป่วยพิเศษรังสีรักษาและเคมีบำบัด 2 ชั้น 5 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i172": "หอผู้ป่วยพิเศษอายุรกรรม 16/7 อาคาร 16",
  "i035": "หอผู้ป่วยแยกโรค 9/5 อาคาร 9",
  "i329": "หอผู้ป่วยรังสีรักษาและเคมีบำบัด 2 ชั้น 3 รพ.สาขาศูนย์มะเร็ง อาคารศูนย์มะเร็ง",
  "i234": "หอผู้ป่วยสามัญกุมารเวชกรรม 12/2 อาคาร 12",
  "i243": "หอผู้ป่วยสามัญจักษุ โสต ศอ นาสิก 13/3 อาคาร 13",
  "i032": "หอผู้ป่วยสามัญศัลยกรรมชาย 1 11/4 อาคาร 11",
  "i031": "หอผู้ป่วยสามัญศัลยกรรมชาย 2 11/7 อาคาร 11",
  "i290": "หอผู้ป่วยสามัญศัลยกรรมประสาท 14/2-2 อาคาร 14",
  "i030": "หอผู้ป่วยสามัญศัลยกรรมหญิง 11/5 อาคาร 11",
  "i238": "หอผู้ป่วยสามัญสูติ-นรีเวชกรรม 12/3 อาคาร 12",
  "i018": "หอผู้ป่วยสามัญออร์โธปิดิกส์ชาย 13/2 อาคาร 13",
  "i023": "หอผู้ป่วยสามัญออร์โธปิดิกส์หญิง 13/1 อาคาร 13",
  "i034": "หอผู้ป่วยสามัญอายุรกรรมชาย 1 16/3 อาคาร 16",
  "i033": "หอผู้ป่วยสามัญอายุรกรรมชาย 2 16/4 อาคาร 16",
  "i275": "หอผู้ป่วยสามัญอายุรกรรมหญิง 1 11/6 อาคาร 11",
  "i024": "หอผู้ป่วยสามัญอายุรกรรมหญิง 2 11/7 อาคาร 11",
  "i137": "หอผู้ป่วยสามัญอุบัติเหตุ 1 1/3-1 อาคาร 1",
  "i138": "หอผู้ป่วยสามัญอุบัติเหตุ 2 1/3-2 อาคาร 1",
  "i373": "หอผู้ป่วยหนัก Smart ICU 1 (16/8) อาคาร 16",
  "i374": "หอผู้ป่วยหนัก Smart ICU 2 (16/8) อาคาร 16",
  "i007": "หอผู้ป่วยหนักกุมารเวชกรรม 3/1 -1 อาคาร 3",
  "i001": "หอผู้ป่วยหนักทารกแรกเกิด 1 10/5-1 อาคาร 10",
  "i145": "หอผู้ป่วยหนักทารกแรกเกิด 2 14/1-1 อาคาร 14",
  "i319": "หอผู้ป่วยหนักทารกแรกเกิด 3 14/1-2 อาคาร 14",
  "i324": "หอผู้ป่วยหนักระบบทางเดินหายใจกุมารเวชกรรม 3/1-2 อาคาร 3",
  "i241": "หอผู้ป่วยหนักระบบทางเดินหายใจกุมารเวชกรรม 9/3 อาคาร 9",
  "i317": "หอผู้ป่วยหนักโรคหลอดเลือดสมอง 11/3-2 อาคาร 11",
  "i274": "หอผู้ป่วยหนักโรคหัวใจ (ccu) 6/1 อาคาร 6",
  "i265": "หอผู้ป่วยหนักศัลยกรรม 11/2 อาคาร 11",
  "i201": "หอผู้ป่วยหนักศัลยกรรมประสาท 11/2 อาคาร 11",
  "i301": "หอผู้ป่วยหนักศัลยกรรมอุบัติเหตุ 10/5-3 อาคาร 10",
  "i371": "หอผู้ป่วยหนักอายุรกรรม (Smart ICU) 16/8 อาคาร 16",
  "i246": "หอผู้ป่วยหนักอายุรกรรม 1 16/8-1 อาคาร 16",
  "i247": "หอผู้ป่วยหนักอายุรกรรม 2 16/8-2 อาคาร 16",
  "i029": "หอผู้ป่วยหนักอายุรกรรม 3 11/3-1 อาคาร 11"
};

const itEquipmentList = [
    { name: "Monitor (จอภาพ)", code: "MON" },
    { name: "Keyboard (คีย์บอร์ด)", code: "KB" },
    { name: "Mouse (เมาส์)", code: "MS" },
    { name: "Speaker (ลำโพง)", code: "SPK" },
    { name: "Headset (หูฟัง)", code: "HS" },
    { name: "Printer (เครื่องพิมพ์)", code: "PRN" },
    { name: "Scanner (สแกนเนอร์)", code: "SCN" },
    { name: "UPS (เครื่องสำรองไฟ)", code: "UPS" },
    { name: "USB Flash Drive (แฟลชไดรฟ์)", code: "UFD" },
    { name: "USB Wi-Fi (ตัวรับสัญญาณเน็ต)", code: "UWF" },
    { name: "CPU (Central Processing Unit)", code: "CPU" },
    { name: "Motherboard (เมนบอร์ด)", code: "MB" },
    { name: "RAM (Random Access Memory)", code: "RAM" },
    { name: "Graphics Card (การ์ดจอ)", code: "GPU" },
    { name: "Hard Disk Drive (HDD)", code: "HDD" },
    { name: "Solid State Drive (SSD)", code: "SSD" },
    { name: "Power Supply (พาวเวอร์ซัพพลาย)", code: "PSU" },
    { name: "CPU Cooler (คูลเลอร์ซีพียู)", code: "CPL" },
    { name: "Sound Card (การ์ดเสียง)", code: "SND" },
    { name: "Network Card (การ์ดแลน)", code: "LAN" }
];

const dispenserList = [
    "บรรเจิด สลักพิศพักตร์",
    "Admin IT",
    "จันทกานต์ จันทร์ตาใหม่",
    "ฉันทวัฒน์ สุทธิพงษ์",
    "ณรงค์ รวมสุข",
    "ณัฐวุฒิ อินต๊ะผัด",
    "ทรงกลด สิงห์สันต์",
    "ธนากร ลุงหม่อง",
    "พัชชามาศ กาแก้ว",
    "ภาณุพงศ์ เชื่อมชิต",
    "มนตรี เครือซุย",
    "รสริน อุทิศเวทศักดิ์",
    "ศิวาพร ยอดเมือง",
    "อณุศักดิ์ เวียงนาค",
    "อาจารีย์ โสภากร"
];

export default function ItDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [stocks, setStocks] = useState([]);

    const generateDocNo = () => {
        const date = new Date();
        const year = String(date.getFullYear() + 543).slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const randomStr = Math.floor(100 + Math.random() * 900);
        return `IT-${year}${month}-${randomStr}`;
    };

    const [formData, setFormData] = useState({
        docNo: generateDocNo(),
        requestDate: new Date().toISOString().split('T')[0],
        requester: '',
        dispenser: currentUser?.email || '',
        detail: '',
        department: '',
        note: ''
    });

    const [items, setItems] = useState([]);

    const [searchId, setSearchId] = useState('');

    useEffect(() => {
        const stocksRef = ref(db, 'stocks');
        const unsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val();
            const loadedStocks = [];
            if (data) {
                for (const key in data) {
                    if (data[key].status === 'รับเข้า') {
                        loadedStocks.push({ 
                            id: key, 
                            ...data[key],
                            brandModel: decryptData(data[key].brandModel || '')
                        });
                    }
                }
            }
            setStocks(loadedStocks);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const itemNames = items.filter(item => item.name).map(item => item.name).join(', ');
        setFormData(prev => ({ ...prev, detail: itemNames }));
    }, [items]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchIdChange = (e) => {
        const value = e.target.value;
        setSearchId(value);
        if (value.toLowerCase().startsWith('i') && departmentMapping[value.toLowerCase()]) {
            setFormData(prev => ({ 
                ...prev, 
                department: departmentMapping[value.toLowerCase()] 
            }));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                if (field === 'name') {
                    const equipment = itEquipmentList.find(eq => eq.name === value);
                    const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
                    const newCode = equipment ? `${equipment.code}-${randomNum}IT` : item.code;
                    return { ...item, name: value, code: newCode };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleAddItem = () => {
        setItems(prev => [...prev, { id: Date.now(), code: '', name: '', unit: '', qty: 1, unitPrice: 0 }]);
    };

    const handleAddItemBySelect = (selectedName) => {
        if (!selectedName) return;
        const equipment = itEquipmentList.find(eq => eq.name === selectedName);
        const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        const newCode = equipment ? `${equipment.code}-${randomNum}IT` : '';
        setItems(prev => [...prev, { id: Date.now(), code: newCode, name: selectedName, unit: 'ชิ้น', qty: 1, unitPrice: 0 }]);
    };

    const handleRemoveItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const calculateTotalAmount = (qty, unitPrice) => {
        return (Number(qty) * Number(unitPrice)).toFixed(2);
    };

    const handleSave = async () => {
        if (!formData.requester || items.length === 0 || !items[0].code) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน และเพิ่มรายการอย่างน้อย 1 รายการ');
            return;
        }

        const totalQty = items.reduce((sum, item) => sum + Number(item.qty), 0);
        if (totalQty > 10) {
            alert('ไม่สามารถเบิกจ่ายเกิน 10 ชิ้นต่อการทำรายการได้ (คุมจำกัดการเบิกจ่าย)');
            return;
        }

        if (items.some(item => Number(item.qty) >= 5)) {
            alert('แจ้งเตือน: มีการเบิกวัสดุในปริมาณมาก อาจทำให้ของใกล้หมดสต๊อก กรุณาสั่งซื้อเพิ่มเติม');
        }

        try {
            const txRef = ref(db, 'it_equipment_tx');
            const newTxRef = push(txRef);
            await set(newTxRef, {
                ...formData,
                items: items,
                timestamp: Date.now(),
                type: 'OUT'
            });

            alert('บันทึกข้อมูลเรียบร้อยแล้ว');
            setFormData({
                docNo: generateDocNo(),
                requestDate: new Date().toISOString().split('T')[0],
                requester: '',
                dispenser: currentUser?.email || '',
                detail: '',
                department: '',
                note: ''
            });
            setItems([]);
        } catch (error) {
            console.error('Error saving transaction: ', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Distribution');

        worksheet.columns = [
            { header: 'ลำดับ', key: 'index', width: 10 },
            { header: 'รหัสวัสดุ', key: 'code', width: 20 },
            { header: 'ชื่อวัสดุ', key: 'name', width: 30 },
            { header: 'หน่วยนับ', key: 'unit', width: 15 },
            { header: 'จำนวน', key: 'qty', width: 10 },
            { header: 'ราคาต่อหน่วย', key: 'unitPrice', width: 15 },
            { header: 'จำนวนเงิน', key: 'total', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { horizontal: 'center' };

        items.forEach((item, index) => {
            worksheet.addRow({
                index: index + 1,
                code: item.code,
                name: item.name,
                unit: item.unit,
                qty: item.qty,
                unitPrice: item.unitPrice,
                total: calculateTotalAmount(item.qty, item.unitPrice)
            });
        });

        worksheet.spliceRows(1, 0, 
            ['ใบเบิกจ่ายวัสดุ'],
            [],
            ['เลขที่เอกสาร:', formData.docNo, 'วันที่ขอ:', formData.requestDate],
            ['ผู้เบิก:', formData.requester, 'ผู้จ่าย:', formData.dispenser],
            ['รายการเบิก:', formData.detail, 'หน่วยงาน:', formData.department],
            ['หมายเหตุ:', formData.note],
            []
        );

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Distribution_${formData.docNo}.xlsx`);
    };

    const styles = {
        systemHeader: {
            backgroundColor: '#8B0000',
            color: 'white',
            padding: '10px 15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px'
        },
        actionBtn: {
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: '1px solid #ccc',
            marginLeft: '5px',
            fontSize: '0.85rem',
            padding: '4px 12px'
        },
        formContainer: {
            backgroundColor: '#008080',
            padding: '20px',
            color: 'white',
            borderBottomLeftRadius: '5px',
            borderBottomRightRadius: '5px'
        },
        label: {
            fontSize: '0.9rem',
            marginBottom: '4px'
        },
        input: {
            fontSize: '0.9rem',
            borderRadius: '0',
            border: '1px solid #ccc',
            padding: '4px 8px',
            height: '32px'
        },
        tableHeader: {
            backgroundColor: '#1a237e',
            color: 'white',
            fontSize: '0.9rem',
            textAlign: 'center'
        },
        tableRow: {
            backgroundColor: 'white',
            fontSize: '0.9rem'
        },
        excelBtn: {
            backgroundColor: 'transparent',
            border: '2px solid #ef4444',
            color: '#ef4444',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 30px',
            borderRadius: '5px',
            cursor: 'pointer',
            height: '100%',
            transition: 'all 0.2s'
        }
    };

    return (
        <div className="container-fluid py-4" style={{ fontFamily: 'Inter, Prompt, sans-serif', minHeight: '100vh', background: 'radial-gradient(circle at 50% -20%, #ffffff 0%, #f3f4f6 50%, #e2e8f0 100%)' }}>
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: '#1e293b', letterSpacing: '-0.5px' }}>
                        <FaLaptopCode className="me-2 text-primary" />
                        IT-Hardware
                    </h2>
                    <p className="text-muted mb-0">ระบบบริหารจัดการอุปกรณ์ไอที (Hardware)</p>
                </div>
                <div className="d-flex gap-2">
                    <Link to="/it-equipment/issue">
                        <Button className="rounded-pill px-4 shadow-sm border-0 d-flex align-items-center gap-2" style={{ background: 'linear-gradient(45deg, #ef4444, #f87171)', transition: 'all 0.3s' }}>
                            <FaArrowUp /> การเบิกจ่ายวัสดุ
                        </Button>
                    </Link>
                    <Link to="/it-equipment/reports">
                        <Button className="rounded-pill px-4 shadow-sm border-0 d-flex align-items-center gap-2" style={{ background: 'linear-gradient(45deg, #3b82f6, #60a5fa)', transition: 'all 0.3s' }}>
                            รายงาน
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Distribution Form Section Replacing the Dashboard Stats */}
            <div style={{ maxWidth: '1000px', margin: '0 auto', boxShadow: '0 0 15px rgba(0,0,0,0.2)', fontFamily: 'Tahoma, sans-serif' }}>
                {/* Header (Red) */}
                <div style={styles.systemHeader}>
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '1.2rem' }}>📝</span>
                        <h5 className="mb-0 fw-bold">ระบบเบิกจ่ายวัสดุ</h5>
                    </div>
                    <div>
                        <button style={styles.actionBtn}><FaPrint className="me-1"/> พิมพ์</button>
                        <button style={styles.actionBtn} onClick={handleSave}><FaSave className="me-1"/> บันทึก</button>
                        <button style={styles.actionBtn} onClick={() => navigate('/')}><FaSignOutAlt className="me-1"/> ออก</button>
                    </div>
                </div>

                {/* Form Section (Teal) */}
                <div style={styles.formContainer}>
                    <Row className="mb-2">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label style={styles.label}>เลขที่เอกสาร</Form.Label>
                                <Form.Control 
                                    name="docNo" 
                                    value={formData.docNo} 
                                    onChange={handleFormChange}
                                    style={styles.input} 
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label style={styles.label}>วันที่ขอ</Form.Label>
                                <Form.Control 
                                    type="date" 
                                    name="requestDate"
                                    value={formData.requestDate} 
                                    onChange={handleFormChange}
                                    style={styles.input} 
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label style={styles.label}>ค้นหาด้วย ID</Form.Label>
                                <Form.Control 
                                    name="searchId"
                                    value={searchId}
                                    onChange={handleSearchIdChange}
                                    placeholder="เช่น i319"
                                    style={styles.input}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex justify-content-end">
                            <div 
                                style={styles.excelBtn} 
                                onClick={exportToExcel}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span>Excel</span>
                            </div>
                        </Col>
                    </Row>
                    
                    <Row className="mb-2">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={styles.label}>ผู้เบิก</Form.Label>
                                <Form.Control 
                                    name="requester"
                                    value={formData.requester}
                                    onChange={handleFormChange}
                                    style={styles.input}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label style={styles.label}>ผู้จ่าย</Form.Label>
                                <Form.Select 
                                    name="dispenser"
                                    value={formData.dispenser}
                                    onChange={handleFormChange}
                                    style={styles.input} 
                                >
                                    <option value="">-- เลือกผู้จ่าย --</option>
                                    {dispenserList.map((name, index) => (
                                        <option key={index} value={name}>{name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label style={styles.label}>+ เพิ่มรายการวัสดุ</Form.Label>
                                <Form.Select
                                    value=""
                                    onChange={(e) => handleAddItemBySelect(e.target.value)}
                                    style={{ ...styles.input, borderColor: '#ef4444', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    <option value="">-- เลือกวัสดุ --</option>
                                    {itEquipmentList.map((eq, i) => (
                                        <option key={i} value={eq.name}>{eq.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={styles.label}>หมายเหตุ</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    name="note"
                                    value={formData.note}
                                    onChange={handleFormChange}
                                    style={{ ...styles.input, height: '70px', resize: 'none' }} 
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Row className="mb-2">
                                <Col>
                                    <Form.Group>
                                        <Form.Label style={styles.label}>รายการเบิก</Form.Label>
                                        <Form.Control 
                                            name="detail"
                                            value={formData.detail}
                                            onChange={handleFormChange}
                                            style={styles.input} 
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <Form.Group>
                                        <Form.Label style={styles.label}>หน่วยงาน</Form.Label>
                                        <Form.Control 
                                            name="department"
                                            value={formData.department}
                                            onChange={handleFormChange}
                                            style={styles.input} 
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    {/* Table Section */}
                    <div style={{ backgroundColor: '#ccc', padding: '2px', marginTop: '10px' }}>
                        <Table bordered hover size="sm" style={{ marginBottom: 0 }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.tableHeader, width: '40px' }}>ลำดับ</th>
                                    <th style={styles.tableHeader}>รหัสวัสดุ</th>
                                    <th style={styles.tableHeader}>ชื่อวัสดุ</th>
                                    <th style={{ ...styles.tableHeader, width: '100px' }}>หน่วยนับ</th>
                                    <th style={{ ...styles.tableHeader, width: '100px' }}>ราคาต่อหน่วย</th>
                                    <th style={{ ...styles.tableHeader, width: '120px' }}>จำนวนเงิน</th>
                                    {currentUser?.role === 'admin' && <th style={{ ...styles.tableHeader, width: '40px' }}>ลบ</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id} style={styles.tableRow}>
                                        <td className="text-center align-middle" style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
                                            {index + 1}
                                        </td>
                                        <td>
                                            <Form.Control 
                                                size="sm" 
                                                value={item.code} 
                                                onChange={(e) => handleItemChange(item.id, 'code', e.target.value)}
                                                style={{ border: 'none', boxShadow: 'none', backgroundColor: 'transparent' }} 
                                            />
                                        </td>
                                        <td>
                                            <Form.Select 
                                                size="sm" 
                                                value={item.name} 
                                                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                style={{ border: 'none', boxShadow: 'none', backgroundColor: 'transparent' }} 
                                            >
                                                <option value="">-- เลือกวัสดุ --</option>
                                                {itEquipmentList.map((eq, i) => (
                                                    <option key={i} value={eq.name}>{eq.name}</option>
                                                ))}
                                            </Form.Select>
                                        </td>
                                        <td>
                                            <Form.Control 
                                                size="sm" 
                                                value={item.unit} 
                                                onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                                style={{ border: 'none', boxShadow: 'none', backgroundColor: 'transparent' }} 
                                            />
                                        </td>
                                        <td>
                                            <Form.Control 
                                                type="number" 
                                                size="sm" 
                                                value={item.unitPrice} 
                                                onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                                                style={{ border: 'none', boxShadow: 'none', backgroundColor: 'transparent', textAlign: 'right' }} 
                                            />
                                        </td>
                                        <td className="text-end align-middle px-2">
                                            {calculateTotalAmount(item.qty, item.unitPrice)}
                                        </td>
                                        {currentUser?.role === 'admin' && (
                                            <td className="text-center align-middle">
                                                <span 
                                                    style={{ color: '#dc3545', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
                                                    onClick={() => handleRemoveItem(item.id)}
                                                >
                                                    ✕
                                                </span>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        
                        {items.length === 0 && (
                            <div style={{ backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                เลือกวัสดุจากรายการด้านบน เพื่อเพิ่มรายการเบิก
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Footer Section */}
                <div style={{ backgroundColor: '#1a237e', color: 'white', padding: '5px 15px', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px' }}>
                    <div>รายการทั้งหมด: {items.length} รายการ</div>
                    <div style={{ display: 'flex', gap: '30px', marginRight: '20px' }}>
                        <span>จำนวน: {items.length} ชิ้น</span>
                        <span>มูลค่ารวม: {items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0).toFixed(2)} บาท</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

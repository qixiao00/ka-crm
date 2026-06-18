USE ka_csm_fujian;

INSERT INTO managers (name, phone, region) VALUES
  ('林明纲', '91202', '福建区'),
  ('张秋', '42012', '福建区'),
  ('姚中强', '27624', '福建区'),
  ('林喆', '19852', '福建区'),
  ('王志杰', NULL, '福建区'),
  ('郭艺勇', '19736', '福建区')
ON DUPLICATE KEY UPDATE phone = VALUES(phone), region = VALUES(region);

INSERT INTO users (username, display_name, password_hash, role, phone, enabled, bound_manager_id)
SELECT '91202', '林明纲', 'replace-with-bcrypt-hash', 'manager', '91202', 1, (SELECT id FROM managers WHERE name = '林明纲')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = '91202');

INSERT INTO users (username, display_name, password_hash, role, phone, enabled, bound_manager_id)
SELECT '42012', '张秋', 'replace-with-bcrypt-hash', 'manager', '42012', 1, (SELECT id FROM managers WHERE name = '张秋')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = '42012');

INSERT INTO users (username, display_name, password_hash, role, phone, enabled, bound_manager_id)
SELECT '27624', '姚中强', 'replace-with-bcrypt-hash', 'manager', '27624', 1, (SELECT id FROM managers WHERE name = '姚中强')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = '27624');

INSERT INTO users (username, display_name, password_hash, role, phone, enabled, bound_manager_id)
SELECT '19852', '林喆', 'replace-with-bcrypt-hash', 'supervisor', '19852', 1, (SELECT id FROM managers WHERE name = '林喆')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = '19852');

INSERT INTO users (username, display_name, password_hash, role, phone, enabled, bound_manager_id)
SELECT '19736', '郭艺勇', 'replace-with-bcrypt-hash', 'manager', '19736', 1, (SELECT id FROM managers WHERE name = '郭艺勇')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = '19736');

INSERT INTO customers
  (name, parent_customer_id, city, industry, satisfaction_status, risk_level, manager_id, break_amount, renewal_amount, repurchase_amount, eos_amount, remark, last_updated_at)
VALUES
  ('紫金矿业集团股份有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='林喆'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('福建省港口集团有限责任公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='林喆'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('厦门建发集团有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='林喆'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('厦门国际银行股份有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='林喆'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('厦门国贸控股集团有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='姚中强'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('厦门信息集团', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='姚中强'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('厦门翔业集团有限公司（机场）', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='姚中强'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('厦门象屿集团有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='姚中强'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('福耀玻璃工业集团股份有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='林明纲'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('宁德时代新能源科技股份有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='林明纲'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('福建省农村信用社联合社', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='林明纲'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('福建省公安厅', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='张秋'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('福州市公安局', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='张秋'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('福建省大数据集团有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='张秋'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('数字福州集团', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='张秋'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('福州地铁集团有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='林明纲'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('国网福建省电力有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='王志杰'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('厦门轨道交通集团有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='郭艺勇'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('福建三锋汽配开发有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='林明纲'), 0, 0, 0, 0, '', '2026-06-17 09:35:00'),
  ('福建三锋控股集团有限公司', NULL, '', '', '信任支持', '中', (SELECT id FROM managers WHERE name='林明纲'), 0, 0, 0, 0, '', '2026-06-17 09:35:00')
ON DUPLICATE KEY UPDATE
  city = VALUES(city),
  industry = VALUES(industry),
  satisfaction_status = VALUES(satisfaction_status),
  risk_level = VALUES(risk_level),
  manager_id = VALUES(manager_id),
  break_amount = VALUES(break_amount),
  renewal_amount = VALUES(renewal_amount),
  repurchase_amount = VALUES(repurchase_amount),
  eos_amount = VALUES(eos_amount),
  remark = VALUES(remark),
  last_updated_at = VALUES(last_updated_at);

INSERT INTO push_config
  (webhook_url, push_time, timezone, enabled, include_customer, include_scenario, include_status, include_plan_date)
SELECT NULL, '18:00', 'Asia/Shanghai', 0, 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM push_config);

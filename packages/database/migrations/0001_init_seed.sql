-- Seed tags (taxonomy cố định)
INSERT OR IGNORE INTO tags (id, slug, label_vi, category) VALUES
  ('tag_01', 'thu-nhap-thu-dong',    'Thu nhập thụ động',    'income'),
  ('tag_02', 'tu-do-tai-chinh',      'Tự do tài chính',      'income'),
  ('tag_03', 'x2-x3-thu-nhap',       'x2 x3 thu nhập',       'income'),
  ('tag_04', 'thu-nhap-cao',         'Thu nhập cao',          'income'),
  ('tag_05', 'dong-tien',            'Dòng tiền',             'money'),
  ('tag_06', 'kiem-tien-online',     'Kiếm tiền online',      'money'),
  ('tag_07', 'personal-brand',       'Personal brand',        'brand'),
  ('tag_08', 'cau-chuyen-thuong-hieu','Câu chuyện thương hiệu','brand'),
  ('tag_09', 'loi-chao-hang',        'Lời chào hàng',         'brand'),
  ('tag_10', 'content-viral',        'Content viral',         'viral'),
  ('tag_11', 'viral-trieu-view',     'Viral triệu view',      'viral'),
  ('tag_12', 'xay-kenh',             'Xây kênh',              'content'),
  ('tag_13', 'quay-video',           'Quay video',            'content'),
  ('tag_14', 'fanpage',              'Fanpage',               'content'),
  ('tag_15', 'followers',            'Followers',             'content');

-- Seed sources mặc định
INSERT OR IGNORE INTO sources (id, platform, name, target_id, cron_schedule, is_active) VALUES
  ('src_reddit_pf',   'reddit',   'r/personalfinance',       'personalfinance',   '0 */2 * * *', 1),
  ('src_reddit_ep',   'reddit',   'r/Entrepreneur',          'Entrepreneur',      '0 */2 * * *', 1),
  ('src_reddit_mk',   'reddit',   'r/marketing',             'marketing',         '0 */3 * * *', 1),
  ('src_yt_finance',  'youtube',  'YT: Finance trending VN', 'UCxxxxxxxxxxxx',    '0 */4 * * *', 1),
  ('src_tt_finance',  'tiktok',   'TikTok: #thunhapthudong', 'thunhapthudong',    '0 */4 * * *', 1),
  ('src_tw_money',    'twitter',  'Twitter: passive income', 'passive+income+OR+financial+freedom', '0 */2 * * *', 1);

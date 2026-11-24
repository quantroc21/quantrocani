/* =====================================================================
   DATA — FILE DUY NHẤT BẠN CẦN SỬA
   - Ảnh/video thật nằm ở web/assets/real_photos và web/assets/real_videos
   - Nhạc: bỏ file web/assets/music.mp3 (không có thì tự phát nhạc nền tổng hợp)
   ===================================================================== */
window.SHOW = {
  her: 'Khuê',
  startDate: '2022-11-26',
  dateLabel: '26 tháng 11 năm 2026',
  music: 'assets/music.mp3',

  /* ---- 2 BỨC ẢNH THẬT MÀ 16.000 HẠT 3D SẼ TỰ GHÉP THÀNH ---- */
  photoShapes: {
    photo1: 'assets/real_photos/up_4.jpg',
    photo2: 'assets/real_photos/up_6.jpg',
  },

  /* ---- PRELUDE: thông báo trượt ra ở góc màn hình ---- */
  notifications: [
    { title: 'Cảnh báo hệ thống 🐾', body: 'Phát hiện một hacker bốn chân vừa xâm nhập MacBook của Khuê...' },
    { title: 'Gâu gâu!! Hacker Kakao đây!', body: 'Bỏ tay khỏi chuột nha chị Khuê, máy tính bị Kakao hack rồi!' },
  ],

  /* ---- MÀN 1 (~13s): CHIẾN DỊCH KAKAO HACK MÁY CHỊ KHUÊ & CHẠY CHƠI LÚC ĐỌC THƯ ---- */
  kakaoIntro: {
    photo: 'assets/real_photos/kakao_sleep.jpg',
    bannerTitle: '🐾 MÁY TÍNH CỦA CHỊ KHUÊ ĐÃ BỊ KAKAO HACK! 🐾',
    bannerDone:  '❤️ KAKAO MỞ KHÓA MÁY — NHƯỜNG SÂN KHẤU CHO ANH QUÂN ❤️',
    preludeLines: {
      leash:    'Hehe Kakao hack khóa máy chị Khuê rồi! Dẫn đi công viên mới mở khóa nha! 🌳🐾',
      peek:     'Mật khẩu mở MacBook hôm nay là: Dắt Kakao đi công viên 3 vòng!!',
      belly:    'Hack luôn chuột cảm ứng rồi! Nằm ăn vạ chờ gãi bụng 10 cái nè!',
      zoom:     'Đang lục ổ cứng tìm chỗ giấu bánh thưởng với kho ảnh kỷ niệm... 🦋',
      realize:  'Ủa khoan... trong ổ cứng có thư bí mật kỷ niệm 4 năm anh Quân gửi chị Khuê nè!!',
      handover: 'Thôi hôm nay Kakao tha không hack nữa, nhịn đi công viên 1 bữa! Chị Khuê xem quà của anh Quân nha ❤️',
    },
  },

  /* ---- PRELUDE MÀN 2: 5 cửa sổ chữ bùng nổ + thời gian giữ lại để ngắm ---- */
  wordHoldSec: 6.4,
  wordBursts: [
    { text: 'CHÚC',                     tone: 'gold',         bg: 'assets/real_photos/up_1.jpg',     rot: -4.0, x: 0.21, y: 0.23, w: 320, h: 175, fx: 'peony',       pal: 'gold' },
    { text: 'MỪNG',                     tone: 'rose',         bg: 'assets/real_photos/up_4.jpg',     rot:  3.5, x: 0.78, y: 0.23, w: 340, h: 175, fx: 'chrys',       pal: 'rose' },
    { text: '4 NĂM',                    tone: 'ivory-hero',   bg: 'assets/real_photos/up_6.jpg',     rot: -2.5, x: 0.23, y: 0.52, w: 390, h: 195, fx: 'brocade',     pal: 'gold' },
    { text: 'ANNIVERSARY',              tone: 'rose',         bg: 'assets/real_photos/img_2058.jpg', rot:  2.2, x: 0.76, y: 0.52, w: 495, h: 190, fx: 'doubleHeart', pal: 'rose' },
    { text: 'CỦA HAI VỢ CHỒNG MÌNH ❤️', tone: 'ivory-banner', bg: 'assets/real_photos/up_2.jpg',     rot:  0.0, x: 0.50, y: 0.80, w: 750, h: 175, fx: 'doubleHeart', pal: 'gold' },
  ],

  /* ---- FINALE: 8 ảnh thật (hai bạn + bé Kakao) xoay vòng quanh trái tim 3D ---- */
  ring: [
    'assets/real_photos/up_4.jpg',
    'assets/real_photos/up_6.jpg',
    'assets/real_photos/img_2021.jpg',
    'assets/real_photos/kakao_0612.jpg',
    'assets/real_photos/img_1937.jpg',
    'assets/real_photos/kakao_sleep.jpg',
    'assets/real_photos/img_2054.jpg',
    'assets/real_photos/img_2058.jpg',
  ],

  /* ---- BỨC THƯ TAY & CHẶNG ĐƯỜNG CÁC CĂN PHÒNG ---- */
  pages: [
    {
      shape: 'four',
      shapeOffset: [-2.35, 0.25],
      shapeScale: 0.85,
      atmo: 'petals',
      palette: 'gold',
      mood: 'warm',
      dur: 12,
      greeting: 'Gửi Khuê của anh,',
      paragraphs: [
        'Chúc mừng kỷ niệm 4 năm của tụi mình nha eiuuu 🥹❤️',
        'Trộm vía tụi mình đi với nhau tới cột mốc này rồi nè. Năm nay anh không muốn viết mấy lời chúc chung chung hay cảm ơn qua loa như mọi năm nữa, vì tụi mình bây giờ đã khác rồi. Bốn năm bên nhau đủ để tình cảm này không còn là chuyện thích nhau bình thường nữa, mà là sự gắn bó thật sự của hai đứa đã cùng nhau lớn lên.',
      ],
      highlights: ['cột mốc này', 'cùng nhau lớn lên'],
      polaroids: [
        { src: 'assets/real_photos/up_4.jpg',     note: '4 năm bên nhau',    slot: 'tr' },
        { src: 'assets/real_photos/img_2053.jpg', note: 'Cùng nhau lớn lên', slot: 'bl' },
      ],
    },
    {
      shape: 'photo1',
      shapeOffset: [2.35, 0.35],
      shapeScale: 0.78,
      atmo: 'fireflies',
      palette: 'gold',
      mood: 'warm',
      dur: 13.5,
      paragraphs: [
        'Năm thứ 4 này đúng là năm hạnh phúc nhất của anh từ trước tới giờ luôn á, kiểu mỗi ngày thương em lại lũy tiến lên thêm một chút. Trộm vía tụi mình đã làm được cái wishlist đầu tiên là đi du lịch riêng với nhau, từ Vũng Tàu cho tới chuyến đi ở villa Melia Hồ Tràm mới cách đây hai tuần.',
        'Được ăn cùng em, uống rượu cùng em, ngủ cùng em rồi quay vlog chung với nhau, cảm giác đó đối với anh nó trọn vẹn và hạnh phúc đối với anhh. Mấy tấm hình với mấy cái clip này chỉ mới là khởi đầu cho những chuyến đi xa hơn của tụi mình hoi.',
      ],
      highlights: ['năm hạnh phúc nhất của anh', 'Vũng Tàu', 'Melia Hồ Tràm', 'trọn vẹn và hạnh phúc'],
      polaroids: [
        { src: 'assets/real_photos/up_5.jpg',       note: 'Chụp hình & quay vlog chung',      slot: 'tl' },
        { src: 'assets/real_videos/vid_2051.mp4',   note: 'Melia Hồ Tràm mới hai tuần trước', slot: 'bl' },
        { src: 'assets/real_photos/kakao_0612.jpg', note: 'Khuê và bé Kakao',                 slot: 'br' },
      ],
    },
    {
      type: 'rooms',
      atmo: 'fireflies',
      palette: 'gold',
      mood: 'warm',
      dur: 21,
      title: 'Chặng đường tụi mình đi cùng nhau',
      stays: [
        {
          hotel: 'Melia Hồ Tràm',
          room: '1101',
          kind: 'Junior Suite',
          note: '23/6, chuyến đầu tiên',
          media: [
            { src: 'assets/real_photos/up_1.jpg', note: 'Ban công phòng 1101 — 23/6', slot: 'tl' },
          ],
        },
        {
          hotel: 'Fusion',
          room: '707',
          kind: 'Fusion Suite',
          note: 'Lần thứ hai bên nhau',
          media: [
            { src: 'assets/real_photos/up_2.jpg', note: 'Fusion Suite 707', slot: 'bl' },
          ],
        },
        {
          hotel: 'Melia Hồ Tràm',
          room: 'C41',
          kind: 'Villa',
          note: 'Lần thứ ba, hai tuần trước',
          media: [
            { src: 'assets/real_videos/vid_2052.mp4', note: 'Villa C41 — Melia Hồ Tràm', slot: 'tr' },
            { src: 'assets/real_photos/img_1978.jpg', note: 'Kỷ niệm ở Villa C41',       slot: 'br' },
          ],
        },
        {
          future: true,
          hotel: 'Chặng tiếp theo',
          room: '∞',
          kind: 'Phuket & khắp thế giới',
          note: 'Và còn rất nhiều căn phòng nữa cùng em',
          media: [],
        },
      ],
    },
    {
      shape: 'road',
      shapeOffset: [0, 0.2],
      shapeScale: 1.0,
      atmo: 'lanterns',
      palette: 'cool',
      mood: 'tender',
      dur: 13.5,
      paragraphs: [
        'Bước qua năm sau, tụi mình sẽ bước sang một trang hoàn toàn mới, lớn hơn và cũng nhiều thử thách hơn. Anh biết khi nghe năm sau anh qua mỹ, trong lòng em chắc chắn có rất nhiều suy nghĩ và bất an. Sợ xa mặt cách lòng, sợ khoảng cách địa lý, sợ mọi thứ thay đổi.',
        'Anh hiểu hết mấy cái lo đó của thúi mà, vì thương thúi thưn anh nhìuu và anh cũng vậyy anh trân trọng và thương yêu em rất nhiều. Nhưng mà, anh đi lần này không phải để xa em, mà là để mở đường cho tương lai của cả hai đứa mình.',
      ],
      highlights: ['thương thúi thưn anh nhìuu', 'mở đường cho tương lai của cả hai đứa mình'],
      polaroids: [
        { src: 'assets/real_photos/img_1937.jpg', note: 'Bình yên bên em',     slot: 'tl' },
        { src: 'assets/real_photos/img_2014.jpg', note: 'Thương thúi nhìuu',   slot: 'bl' },
        { src: 'assets/real_photos/img_2012.jpg', note: 'Lúc nào cũng nhớ em', slot: 'br' },
      ],
    },
    {
      shape: 'ring',
      shapeOffset: [-2.35, 0.2],
      shapeScale: 0.88,
      atmo: 'meteors',
      palette: 'gold',
      mood: 'hopeful',
      dur: 14,
      firework: 'ring',
      paragraphs: [
        'Tụi mình cũng toán kỹ hết từng bước đi rồi. Lúc anh quay về, tụi mình sẽ không dừng lại ở danh nghĩa người yêu nữa. Anh về để cùng Khuê đi đăng ký kết hôn, để từ giây phút đó anh được chính thức gọi em là vợ, và bắt tay làm hồ sơ f2a để chồng đón vợ sang bên kia với chồng, cùng nhau xây dựng cuộc sống mới.',
        'Hai đứa mình 20 tuổi rồi, anh không muốn hứa suông cho em yên lòng tạm thời, mà anh muốn dùng chính kế hoạch và hành động thực tế của mình để chứng minh cho em thấy anh nghiêm túc với tương lai của vợ chồng mình tới mức nào.',
      ],
      highlights: ['cùng Khuê đi đăng ký kết hôn', 'chính thức gọi em là vợ', 'hồ sơ f2a để chồng đón vợ sang'],
      polaroids: [
        { src: 'assets/real_photos/img_2021.jpg', note: 'Chính thức gọi em là vợ',      slot: 'tr' },
        { src: 'assets/real_photos/up_6.jpg',     note: 'Tương lai của vợ chồng mình', slot: 'br' },
        { src: 'assets/real_photos/up_3.jpg',     note: 'Cô gái của anh',              slot: 'bl' },
      ],
    },
    {
      shape: 'photo2',
      shapeOffset: [-2.35, 0.2],
      shapeScale: 0.82,
      atmo: 'petals',
      palette: 'gold',
      mood: 'hopeful',
      dur: 13,
      paragraphs: [
        'Chỉ cần vợ tin tưởng và vững tâm đồng hành cùng anh qua giai đoạn này thôi. Sau khi lo xong hết giấy tờ thủ tục, việc đầu tiên anh làm là dắt vợ đi Phuket ở resort nghỉ dưỡng cho thật trọn vẹn, bù lại khoảng thời gian xa nhau.',
        'Rồi sau này khi vợ chồng mình ổn định cuộc sống bên kia rồi, mình sẽ cùng nhau đi hết cái wishlist khám phá thật nhiều resort sang trọng trên khắp thế giới nha!',
      ],
      highlights: ['dắt vợ đi Phuket', 'đi hết cái wishlist'],
      polaroids: [
        { src: 'assets/real_photos/img_2054.jpg',   note: 'Hẹn vợ ở Phuket',       slot: 'tr' },
        { src: 'assets/real_photos/kakao_0853.jpg', note: 'Cả nhà mình vui vẻ',    slot: 'br' },
      ],
    },
    {
      shape: 'heart',
      shapeOffset: [2.35, 0.55],
      shapeScale: 0.84,
      atmo: 'petals_gold',
      palette: 'rose',
      mood: 'hopeful',
      dur: 10.5,
      paragraphs: [
        'Chúc mừng 4 năm yêu nhau của tụi mình.',
        'Yêu em, yêu vợ của anh và thương cả Kakao nhiều lắm lắm luôn 😘😘❤️',
      ],
      signoff: 'Thương vợ nhiều,',
      signature: 'Chồng tương lai của Khuê ❤️',
      polaroids: [
        { src: 'assets/real_photos/img_2058.jpg',      note: 'Yêu vợ của anh nhiều lắm',      slot: 'tl' },
        { src: 'assets/real_videos/kakao_clip3.mp4',   note: 'Thương cả Kakao nhiều lắm ❤️', slot: 'bl' },
        { src: 'assets/real_photos/kakao_sleep.jpg',   note: 'Bé Kakao ngủ ngon',             slot: 'br' },
      ],
    },
    {
      shape: 'heart',
      atmo: 'petals_gold',
      palette: 'rose',
      mood: 'finale',
      dur: 0,
      finale: true,
      title: 'Chúc mừng kỷ niệm 4 năm của tụi mình',
      subtitle: 'Yêu em, yêu vợ của anh và thương cả Kakao nhiều lắm lắm luôn 😘😘❤️',
    },
  ],
};

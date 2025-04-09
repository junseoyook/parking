const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 디바이스 데이터
const devices = new Map();
devices.set('ESP32_001', {
  secret: 'esp32-secret-key',
  shouldOpen: false,
  shouldClose: false
});

// 에러 응답 헬퍼
const errorResponse = (res, status, message) => {
  return res.status(status).json({ error: message });
};

// 디바이스 인증
const authenticateDevice = (req, res, next) => {
  const deviceId = req.headers['x-device-id'];
  const deviceSecret = req.headers['x-device-secret'];
  
  if (!deviceId || !deviceSecret) {
    return errorResponse(res, 401, '디바이스 ID와 시크릿이 필요합니다');
  }
  
  const device = devices.get(deviceId);
  if (!device) {
    return errorResponse(res, 404, '등록되지 않은 디바이스입니다');
  }
  
  if (device.secret !== deviceSecret) {
    return errorResponse(res, 401, '잘못된 시크릿 키입니다');
  }
  
  req.device = device;
  next();
};

// 상태 확인 엔드포인트
app.get('/status/:deviceId', authenticateDevice, (req, res) => {
  res.json({ 
    shouldOpen: req.device.shouldOpen,
    shouldClose: req.device.shouldClose
  });
});

// 차단기 열기 요청
app.post('/open', authenticateDevice, (req, res) => {
  req.device.shouldOpen = true;
  req.device.shouldClose = false;
  
  res.json({ 
    success: true,
    message: '차단기 열기 신호가 전송되었습니다'
  });
});

// 차단기 닫기 요청
app.post('/close', authenticateDevice, (req, res) => {
  req.device.shouldOpen = false;
  req.device.shouldClose = true;
  
  res.json({ 
    success: true,
    message: '차단기 닫기 신호가 전송되었습니다'
  });
});

// 상태 확인
app.get('/', (req, res) => {
  const deviceList = Array.from(devices.entries()).map(([id, device]) => ({
    id,
    shouldOpen: device.shouldOpen,
    shouldClose: device.shouldClose
  }));
  
  res.json({ 
    status: 'ok', 
    devices: deviceList,
    totalDevices: devices.size
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
}); 
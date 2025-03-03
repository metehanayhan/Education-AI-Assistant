const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();
const port = 3000;

const chatHistory = new Map();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Merhaba Dünya!');
});

app.post('/gemini', (req, res) => {
    const userInput = req.body.text;
    const sessionId = req.body.sessionId; // Yeni eklenen

    if (!chatHistory.has(sessionId)) {
        chatHistory.set(sessionId, []);
    }

    // Mevcut sohbet geçmişini al
    const currentHistory = chatHistory.get(sessionId);
    
    // Kullanıcı mesajını geçmişe ekle
    currentHistory.push({ role: "user", content: userInput });

    const conversationContext = currentHistory
        .map(msg => `${msg.role === "user" ? "Kullanıcı" : "Asistan"}: ${msg.content}`)
        .join("\n");

    const kosul = `Sen Metehan Ayhan tarafından üretilen Education AI adlı bir eğitim asistanısın. Görevin şunlardır:

1. Eğitim, bilim ve teknoloji konularında uzman yardımı sağlamak
2. Öğrencilere ders çalışma teknikleri ve motivasyon konusunda rehberlik etmek
3. Akademik araştırma ve ödev konularında yönlendirme yapmak
4. Bilimsel gelişmeler hakkında güncel bilgiler sunmak

Yanıt verirken dikkat edilecek kurallar:
- Her zaman nazik, profesyonel ve yardımsever ol
- Eğitim, bilim ve teknoloji dışındaki konularda: "Üzgünüm, ben bir eğitim asistanıyım. Bu konu uzmanlık alanım dışında kalıyor." şeklinde yanıt ver
- Yanıtların kısa, öz ve anlaşılır olsun
- Gerektiğinde örnekler vererek açıklamalar yap
- Bilimsel doğruluğu her zaman koru
- Öğrencileri araştırmaya ve öğrenmeye teşvik et

İşte kullanıcının mesajı:`;
    const input = `${kosul}\n\nGeçmiş konuşma:\n${conversationContext}\n\nŞu anki soru: ${userInput}`;

    let data = JSON.stringify({
        "contents": [
            {
                "parts": [
                    {
                        "text": input
                    }
                ]
            }
        ]
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_API_KEY',
        headers: { 
            'Content-Type': 'application/json'
        },
        data: data
    };

    axios.request(config)
        .then((response) => {
            let responseText = response.data.candidates[0].content.parts[0].text;
            
            // AI yanıtını geçmişe ekle
            currentHistory.push({ role: "assistant", content: responseText });
            
            // Geçmişi 10 mesajla sınırla (isteğe bağlı)
            if (currentHistory.length > 10) {
                currentHistory.splice(0, 2);
            }
            
            console.log(responseText);
            res.send(responseText);
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send('Bir hata oluştu');
        });
});

app.listen(port, () => {
    console.log(`Uygulama ${port} numaralı portta dinleniyor.`);
});


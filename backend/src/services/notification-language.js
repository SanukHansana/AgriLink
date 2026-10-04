// Translate system-generated alerts while preserving product names, codes and amounts.
export function notificationText(message, language = 'en') {
  if (language === 'en') return message;
  const si = language === 'si';
  const outbid = /^You have been outbid on (.+)\. Another buyer offered LKR (.+) per (\w+)\. Open My Bids to revise your offer\.$/.exec(message);
  if (outbid) return si ? `${outbid[1]} සඳහා ඉහළ ලංසුවක් ලැබී ඇත. වෙනත් ගැනුම්කරුවෙකු ${outbid[3]} ඒකකයකට රු. ${outbid[2]} දී ඇත. මගේ ලංසු විවෘත කරන්න.` : `${outbid[1]} பொருளில் உங்கள் ஏலம் முந்தப்பட்டது. மற்றொருவர் ${outbid[3]} அலகுக்கு ரூ. ${outbid[2]} அளித்துள்ளார். என் ஏலங்களை திறக்கவும்.`;
  const order = /^Order (\S+) is (.+)\.$/.exec(message);
  const states = {
    'accepted. Please pay for your order before the farmer can prepare it': ['පිළිගෙන ඇත. සූදානම් කිරීමට පෙර ගෙවන්න', 'ஏற்கப்பட்டது. தயாரிப்பிற்கு முன் செலுத்தவும்'],
    preparing: ['සූදානම් කරමින්', 'தயாரிக்கப்படுகிறது'],
    cancelled: ['අවලංගුයි', 'ரத்துசெய்யப்பட்டது'],
    'dispatched and awaiting driver pickup': ['බෙදාහැරීමට නිකුත් කර රියදුරු භාරගැනීම බලාපොරොත්තුවෙන්', 'அனுப்பப்பட்டு ஓட்டுநர் சேகரிப்பிற்கு காத்திருக்கிறது'],
    'out for delivery': ['බෙදාහැරීමට පිටත්ව ඇත', 'விநியோகத்திற்கு புறப்பட்டது'],
    'delivered. Please confirm receipt in Orders': ['භාර දී ඇත. ඇණවුම් තුළ ලැබීම තහවුරු කරන්න', 'வழங்கப்பட்டது. ஆர்டர்களில் பெற்றதை உறுதிசெய்யவும்'],
    'being collected by the driver': ['රියදුරු භාරගනිමින්', 'ஓட்டுநர் சேகரிக்கிறார்'],
  };
  if (order && states[order[2]]) return `${si ? 'ඇණවුම' : 'ஆர்டர்'} ${order[1]}: ${states[order[2]][si ? 0 : 1]}.`;
  const payment = /^Demo payment received for (\S+)\. You can prepare the order\.$/.exec(message);
  if (payment) return si ? `${payment[1]} සඳහා ආදර්ශ ගෙවීම ලැබුණා. ඇණවුම සූදානම් කළ හැක.` : `${payment[1]}-க்கு மாதிரி கட்டணம் பெறப்பட்டது. ஆர்டரை தயாரிக்கலாம்.`;
  const received = /^Buyer confirmed receipt of (\S+)\.$/.exec(message);
  if (received) return si ? `ගැනුම්කරු ${received[1]} ලැබීම තහවුරු කළා.` : `வாங்குபவர் ${received[1]} பெற்றதை உறுதிசெய்தார்.`;
  return message;
}

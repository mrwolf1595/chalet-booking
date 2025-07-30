// app/api/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, message, apiKey } = await request.json();

    // التحقق من البيانات المطلوبة
    if (!phone || !message || !apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: phone, message, or apiKey' 
        }, 
        { status: 400 }
      );
    }
    

    // تنسيق رقم الهاتف
    const formattedPhone = phone.startsWith('966') ? phone : `966${phone}`;
    
    // تحضير رسالة مُرمزة للـ URL
    const encodedMessage = encodeURIComponent(message);

    // CallMeBot API URL
    const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodedMessage}&apikey=${apiKey}`;

    console.log('Sending WhatsApp message to:', formattedPhone);
    console.log('Message:', message);
    console.log('API Key:', apiKey ? 'Provided' : 'Missing');

    // إرسال الطلب لـ CallMeBot
    const response = await fetch(callMeBotUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ChaleBookingSystem/1.0',
      },
    });

    console.log('CallMeBot Response Status:', response.status);
    
    // قراءة النص المُعاد
    const responseText = await response.text();
    console.log('CallMeBot Response Text:', responseText);

    // CallMeBot يرجع نص بسيط، مش JSON
    // عادة يرجع "Message sent" أو error message
    if (response.ok) {
      // معظم خدمات CallMeBot ترجع نجاح حتى لو كان 200
      return NextResponse.json({
        success: true,
        ok: true,
        message: 'WhatsApp message sent successfully',
        details: responseText,
        phone: formattedPhone
      });
    } else {
      // خطأ من CallMeBot
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: 'Failed to send WhatsApp message',
          details: responseText,
          status: response.status
        },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('WhatsApp API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: 'Internal server error while sending WhatsApp message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// معالجة الطرق غير المدعومة
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
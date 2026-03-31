import { Resend } from "resend";

let resend;

const getResend = () => {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

export const sendOTPEmail = async (toEmail, otp) => {
    const { data, error } = await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: [toEmail],
        subject: "Your password reset code",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f0fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Chatify</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Password Reset</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:#334155;font-size:16px;">Hi there,</p>
              <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
                We received a request to reset your password. Use the code below to complete the process:
              </p>
              <!-- OTP Code -->
              <div style="background:#f8f5ff;border:2px dashed #7c3aed;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#7c3aed;">${otp}</span>
              </div>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-align:center;">
                ⏱ This code expires in <strong style="color:#334155;">10 minutes</strong>.
              </p>
              <hr style="border:none;border-top:1px solid #e8e0f0;margin:24px 0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
                If you didn't request this, you can safely ignore this email. Your password won't be changed.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#faf8ff;padding:20px 40px;text-align:center;border-top:1px solid #f0ebf8;">
              <p style="margin:0;color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Chatify. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim(),
    });

    if (error) {
        console.error("Resend error:", error);
        throw new Error("Failed to send OTP email");
    }

    return data;
};

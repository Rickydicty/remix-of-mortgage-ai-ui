// YourKey Mortgage Portal - Email Template Helper
// All emails use consistent branding with SendGrid via the send-notification edge function

export const getEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YourKey Mortgages</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🏠 YourKey</h1>
              <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Mortgage Portal</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@yourkey.ie" style="color: #4CAF50; text-decoration: none;">support@yourkey.ie</a>
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                © ${new Date().getFullYear()} YourKey Mortgages. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const getButtonStyle = () => `
  display: inline-block;
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: #ffffff;
  padding: 14px 28px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  margin: 20px 0;
`;

// Pre-built email templates
export const emailTemplates = {
  messageReceived: (params: {
    recipientName: string;
    senderType: 'broker' | 'client';
    messagePreview: string;
    applicationId?: string;
    loginUrl: string;
  }) => getEmailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">📬 New Message Received</h2>
    <p style="margin: 0 0 15px 0; color: #555; font-size: 16px; line-height: 1.6;">
      Hello <strong>${params.recipientName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
      You have received a new message from your ${params.senderType === 'client' ? 'client' : 'mortgage broker'} regarding your application.
    </p>
    ${params.applicationId ? `<p style="margin: 0 0 10px 0; color: #777; font-size: 14px;"><strong>Application:</strong> ${params.applicationId}</p>` : ''}
    <div style="background: #f8f9fa; border-left: 4px solid #4CAF50; padding: 15px 20px; margin: 20px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; color: #333; font-size: 15px; font-style: italic;">"${params.messagePreview}"</p>
    </div>
    <div style="text-align: center;">
      <a href="${params.loginUrl}" style="${getButtonStyle()}">View Full Message</a>
    </div>
    <p style="margin: 20px 0 0 0; color: #777; font-size: 14px;">
      If you have any questions, please don't hesitate to reach out.
    </p>
  `),

  signatureCompleted: (params: {
    documentType: string;
    applicationId: string;
    signedAt: string;
    dashboardUrl: string;
  }) => getEmailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">✍️ E-Signature Completed</h2>
    <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
      A client has successfully completed an electronic signature on their application.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #f8f9fa; border-radius: 6px; margin: 20px 0;">
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>Document Type:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #e9ecef;">${params.documentType}</td>
      </tr>
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>Application ID:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #e9ecef;">${params.applicationId}</td>
      </tr>
      <tr>
        <td style="color: #777; font-size: 14px;"><strong>Signed At:</strong></td>
        <td style="color: #333; font-size: 14px;">${params.signedAt}</td>
      </tr>
    </table>
    <div style="text-align: center;">
      <a href="${params.dashboardUrl}" style="${getButtonStyle()}">Review in Dashboard</a>
    </div>
  `),

  documentUploaded: (params: {
    documentType: string;
    fileName: string;
    aiScore: number;
    status: string;
    clientNotes?: string;
    dashboardUrl: string;
  }) => getEmailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">📄 New Document Uploaded</h2>
    <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
      A client has uploaded a new document to their mortgage application.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #f8f9fa; border-radius: 6px; margin: 20px 0;">
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>Document Type:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #e9ecef;">${params.documentType}</td>
      </tr>
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>File Name:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #e9ecef;">${params.fileName}</td>
      </tr>
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>AI Score:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #e9ecef;">${params.aiScore}/100</td>
      </tr>
      <tr>
        <td style="color: #777; font-size: 14px;"><strong>Status:</strong></td>
        <td style="color: #333; font-size: 14px;">${params.status}</td>
      </tr>
    </table>
    ${params.clientNotes ? `<p style="margin: 0 0 15px 0; color: #555; font-size: 14px;"><strong>Client Notes:</strong> ${params.clientNotes}</p>` : ''}
    <div style="text-align: center;">
      <a href="${params.dashboardUrl}" style="${getButtonStyle()}">Review Document</a>
    </div>
  `),

  formProgress: (params: {
    clientName: string;
    clientEmail: string;
    completionPercent: number;
    dashboardUrl: string;
  }) => getEmailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">📊 Form Progress Update</h2>
    <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
      Great news! A client has made significant progress on their mortgage application.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #f8f9fa; border-radius: 6px; margin: 20px 0;">
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>Client:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #e9ecef;">${params.clientName}</td>
      </tr>
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>Email:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #e9ecef;">${params.clientEmail}</td>
      </tr>
      <tr>
        <td style="color: #777; font-size: 14px;"><strong>Completion:</strong></td>
        <td style="color: #4CAF50; font-size: 14px; font-weight: bold;">${params.completionPercent}%</td>
      </tr>
    </table>
    <div style="text-align: center;">
      <a href="${params.dashboardUrl}" style="${getButtonStyle()}">View Application</a>
    </div>
  `),

  aipStatusChange: (params: {
    applicationId: string;
    newStatus: string;
    description?: string;
    dashboardUrl: string;
  }) => getEmailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">🔄 AIP Status Update</h2>
    <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
      An Approval in Principle (AIP) condition has been updated.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #f8f9fa; border-radius: 6px; margin: 20px 0;">
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>Application ID:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #e9ecef;">${params.applicationId}</td>
      </tr>
      <tr>
        <td style="color: #777; font-size: 14px;"><strong>New Status:</strong></td>
        <td style="color: #333; font-size: 14px;">${params.newStatus}</td>
      </tr>
    </table>
    ${params.description ? `<p style="margin: 0 0 15px 0; color: #555; font-size: 14px;"><strong>Description:</strong> ${params.description}</p>` : ''}
    <div style="text-align: center;">
      <a href="${params.dashboardUrl}" style="${getButtonStyle()}">Review in Dashboard</a>
    </div>
  `),

  newClientSignup: (params: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    eligibilityScore: number;
    applicantType: string;
    employmentType: string;
    borrowingCapacityLow: number;
    borrowingCapacityHigh: number;
    propertyValue: number;
    depositAmount: number;
    firstTimeBuyer: boolean;
    dashboardUrl: string;
  }) => getEmailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">🎉 New Client Registration</h2>
    <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
      A new client has signed up for the mortgage portal and completed their eligibility assessment.
    </p>
    <h3 style="margin: 20px 0 10px 0; color: #333; font-size: 18px;">Client Details</h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #f8f9fa; border-radius: 6px; margin: 0 0 20px 0;">
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>Name:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #e9ecef;">${params.clientName}</td>
      </tr>
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>Email:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #e9ecef;">${params.clientEmail}</td>
      </tr>
      <tr>
        <td style="color: #777; font-size: 14px;"><strong>Phone:</strong></td>
        <td style="color: #333; font-size: 14px;">${params.clientPhone}</td>
      </tr>
    </table>
    <h3 style="margin: 20px 0 10px 0; color: #333; font-size: 18px;">Eligibility Summary</h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #e8f5e9; border-radius: 6px; margin: 0 0 20px 0;">
      <tr>
        <td style="color: #2E7D32; font-size: 14px; border-bottom: 1px solid #c8e6c9;"><strong>Eligibility Score:</strong></td>
        <td style="color: #1B5E20; font-size: 14px; font-weight: bold; border-bottom: 1px solid #c8e6c9;">${params.eligibilityScore}%</td>
      </tr>
      <tr>
        <td style="color: #2E7D32; font-size: 14px; border-bottom: 1px solid #c8e6c9;"><strong>Applicant Type:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #c8e6c9;">${params.applicantType}</td>
      </tr>
      <tr>
        <td style="color: #2E7D32; font-size: 14px; border-bottom: 1px solid #c8e6c9;"><strong>Employment:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #c8e6c9;">${params.employmentType}</td>
      </tr>
      <tr>
        <td style="color: #2E7D32; font-size: 14px; border-bottom: 1px solid #c8e6c9;"><strong>Borrowing Capacity:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #c8e6c9;">€${params.borrowingCapacityLow.toLocaleString()} - €${params.borrowingCapacityHigh.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="color: #2E7D32; font-size: 14px; border-bottom: 1px solid #c8e6c9;"><strong>Property Value:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #c8e6c9;">€${params.propertyValue.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="color: #2E7D32; font-size: 14px; border-bottom: 1px solid #c8e6c9;"><strong>Deposit:</strong></td>
        <td style="color: #333; font-size: 14px; border-bottom: 1px solid #c8e6c9;">€${params.depositAmount.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="color: #2E7D32; font-size: 14px;"><strong>First Time Buyer:</strong></td>
        <td style="color: #333; font-size: 14px;">${params.firstTimeBuyer ? 'Yes' : 'No'}</td>
      </tr>
    </table>
    <div style="text-align: center;">
      <a href="${params.dashboardUrl}" style="${getButtonStyle()}">View in Dashboard</a>
    </div>
  `),

  batchDocumentUpload: (params: {
    successCount: number;
    errorCount: number;
    documentsList: string[];
    dashboardUrl: string;
  }) => getEmailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">📁 Batch Documents Uploaded</h2>
    <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
      A client has uploaded multiple documents at once.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #f8f9fa; border-radius: 6px; margin: 20px 0;">
      <tr>
        <td style="color: #777; font-size: 14px; border-bottom: 1px solid #e9ecef;"><strong>Total Uploaded:</strong></td>
        <td style="color: #4CAF50; font-size: 14px; font-weight: bold; border-bottom: 1px solid #e9ecef;">${params.successCount} documents</td>
      </tr>
      ${params.errorCount > 0 ? `
      <tr>
        <td style="color: #777; font-size: 14px;"><strong>Failed:</strong></td>
        <td style="color: #f44336; font-size: 14px; font-weight: bold;">${params.errorCount} documents</td>
      </tr>
      ` : ''}
    </table>
    <h3 style="margin: 20px 0 10px 0; color: #333; font-size: 16px;">Documents Uploaded:</h3>
    <ul style="margin: 0; padding: 0 0 0 20px; color: #555;">
      ${params.documentsList.map(doc => `<li style="margin: 5px 0;">${doc}</li>`).join('')}
    </ul>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${params.dashboardUrl}" style="${getButtonStyle()}">Review Documents</a>
    </div>
  `),
};

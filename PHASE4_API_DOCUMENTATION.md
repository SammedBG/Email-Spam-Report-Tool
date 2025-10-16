# Phase 4: Advanced Features API Documentation

## 🤖 Machine Learning Service

### Predict Deliverability
**POST** `/api/advanced/ml/predict`

Predict email deliverability using ML model.

**Request Body:**
```json
{
  "subject": "Your email subject",
  "body": "Email content",
  "senderEmail": "sender@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predictedScore": 85,
    "confidence": 92,
    "features": {
      "strengths": ["Good subject line length", "No spam keywords detected"],
      "weaknesses": [],
      "riskFactors": []
    },
    "recommendations": ["Add unsubscribe link for compliance"]
  }
}
```

### Get Model Performance
**GET** `/api/advanced/ml/performance`

Get ML model performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "isTrained": true,
    "trainingSamples": 1000,
    "accuracy": 87,
    "features": 10,
    "lastTrained": "2024-01-15T10:30:00.000Z"
  }
}
```

### Retrain Model
**POST** `/api/advanced/ml/retrain`

Retrain the ML model with latest data.

**Response:**
```json
{
  "success": true,
  "message": "Model retrained successfully",
  "data": {
    "success": true,
    "samples": 1200
  }
}
```

## 📊 Advanced Reporting Service

### Generate Report
**GET** `/api/advanced/reports/:testCode`

Generate advanced report for a test.

**Query Parameters:**
- `type`: Report type (`executive`, `technical`, `marketing`, `compliance`)
- `userId`: User ID for personalized reports

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "executive",
    "summary": {
      "testCode": "TEST123",
      "overallScore": 85,
      "riskLevel": "Low",
      "riskScore": 20
    },
    "performance": {
      "inboxRate": 80,
      "spamRate": 5,
      "promotionsRate": 15,
      "topPerformingProvider": "Gmail",
      "worstPerformingProvider": "Yahoo"
    },
    "insights": {
      "mlPrediction": 87,
      "confidence": 92,
      "keyFindings": ["Strong deliverability across providers"],
      "trends": ["Improving over time"]
    },
    "recommendations": [
      "Continue current email practices",
      "Monitor Yahoo deliverability"
    ]
  }
}
```

### Generate PDF Report
**GET** `/api/advanced/reports/:testCode/pdf`

Generate PDF version of the report.

**Query Parameters:**
- `type`: Report type
- `userId`: User ID

**Response:** PDF file download

## 🤝 Collaboration Service

### Create Shared Session
**POST** `/api/advanced/collaboration/sessions`

Create a shared test session.

**Request Body:**
```json
{
  "testCode": "TEST123",
  "permissions": {
    "canView": true,
    "canComment": true,
    "canEdit": false,
    "canShare": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "shareUrl": "https://app.example.com/shared/session_abc123",
    "session": {
      "id": "session_abc123",
      "testCode": "TEST123",
      "ownerId": "user123",
      "permissions": {...},
      "participants": ["user123"],
      "isActive": true
    }
  }
}
```

### Join Shared Session
**POST** `/api/advanced/collaboration/sessions/:sessionId/join`

Join an existing shared session.

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {...},
    "testCode": "TEST123"
  }
}
```

### Get User Sessions
**GET** `/api/advanced/collaboration/sessions`

Get all sessions for the current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "session_abc123",
      "testCode": "TEST123",
      "ownerId": "user123",
      "isOwner": true,
      "participantCount": 3
    }
  ]
}
```

### End Shared Session
**POST** `/api/advanced/collaboration/sessions/:sessionId/end`

End a shared session.

**Response:**
```json
{
  "success": true,
  "message": "Session ended successfully"
}
```

## 💬 Comments System

### Add Comment
**POST** `/api/advanced/collaboration/comments`

Add a comment to a test.

**Request Body:**
```json
{
  "testCode": "TEST123",
  "comment": "Great results! The Gmail placement is excellent.",
  "sessionId": "session_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment_xyz789",
      "testCode": "TEST123",
      "userId": "user123",
      "comment": "Great results! The Gmail placement is excellent.",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "sessionId": "session_abc123"
    }
  }
}
```

### Get Comments
**GET** `/api/advanced/collaboration/comments/:testCode`

Get all comments for a test.

**Query Parameters:**
- `sessionId`: Filter by session (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment_xyz789",
      "testCode": "TEST123",
      "userId": "user123",
      "comment": "Great results!",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

### Edit Comment
**PUT** `/api/advanced/collaboration/comments/:commentId`

Edit a comment.

**Request Body:**
```json
{
  "comment": "Updated comment text"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment updated successfully"
}
```

### Delete Comment
**DELETE** `/api/advanced/collaboration/comments/:commentId`

Delete a comment.

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

## 📤 Sharing System

### Share Test with Users
**POST** `/api/advanced/collaboration/share`

Share a test with specific users.

**Request Body:**
```json
{
  "testCode": "TEST123",
  "userIds": ["user456", "user789"],
  "permissions": {
    "canView": true,
    "canComment": true,
    "canEdit": false,
    "canShare": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sharedWith": 2,
    "results": [
      {
        "userId": "user456",
        "sessionId": "session_def456",
        "shareUrl": "https://app.example.com/shared/session_def456"
      }
    ]
  }
}
```

## 🔔 Notifications System

### Get User Notifications
**GET** `/api/advanced/notifications`

Get notifications for the current user.

**Query Parameters:**
- `limit`: Number of notifications to return (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_abc123",
      "userId": "user123",
      "type": "new_comment",
      "message": "New comment added to shared test",
      "testCode": "TEST123",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "isRead": false
    }
  ]
}
```

### Mark Notification as Read
**PUT** `/api/advanced/notifications/:notificationId/read`

Mark a notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

## 🔧 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 📝 Authentication

Most endpoints require authentication. Include the user token in the request headers:

```
Authorization: Bearer <jwt_token>
```

## 🚀 Rate Limiting

Advanced endpoints are rate limited:
- ML predictions: 100 requests/hour
- Report generation: 50 requests/hour
- Collaboration: 200 requests/hour

## 📊 Response Times

Expected response times:
- ML predictions: < 2 seconds
- Report generation: < 5 seconds
- Collaboration operations: < 1 second
- PDF generation: < 10 seconds

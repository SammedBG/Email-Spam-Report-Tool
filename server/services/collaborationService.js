import { TestResult } from '../models/TestResult.js';
import { User } from '../models/User.js';

export class CollaborationService {
  constructor() {
    this.activeSessions = new Map();
    this.sharedTests = new Map();
    this.comments = new Map();
    this.notifications = new Map();
  }

  // Create a shared test session
  async createSharedSession(testCode, ownerId, permissions = {}) {
    try {
      const test = await TestResult.findOne({ code: testCode });
      if (!test) {
        throw new Error('Test not found');
      }

      const sessionId = this.generateSessionId();
      const session = {
        id: sessionId,
        testCode,
        ownerId,
        createdAt: new Date(),
        permissions: {
          canView: permissions.canView || false,
          canComment: permissions.canComment || false,
          canEdit: permissions.canEdit || false,
          canShare: permissions.canShare || false,
          ...permissions
        },
        participants: [ownerId],
        isActive: true
      };

      this.activeSessions.set(sessionId, session);
      this.sharedTests.set(testCode, sessionId);

      return {
        success: true,
        sessionId,
        shareUrl: `${process.env.CLIENT_ORIGIN}/shared/${sessionId}`,
        session
      };
    } catch (error) {
      console.error('Failed to create shared session:', error);
      return { success: false, error: error.message };
    }
  }

  // Join a shared session
  async joinSharedSession(sessionId, userId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.isActive) {
        throw new Error('Session is no longer active');
      }

      // Add user to participants if not already present
      if (!session.participants.includes(userId)) {
        session.participants.push(userId);
      }

      // Send notification to session owner
      await this.sendNotification(session.ownerId, {
        type: 'user_joined',
        message: 'A user joined your shared test session',
        sessionId,
        userId
      });

      return {
        success: true,
        session,
        testCode: session.testCode
      };
    } catch (error) {
      console.error('Failed to join shared session:', error);
      return { success: false, error: error.message };
    }
  }

  // Add comment to a test
  async addComment(testCode, userId, comment, sessionId = null) {
    try {
      const commentId = this.generateCommentId();
      const newComment = {
        id: commentId,
        testCode,
        userId,
        comment,
        createdAt: new Date(),
        sessionId,
        isEdited: false,
        editedAt: null
      };

      // Store comment
      if (!this.comments.has(testCode)) {
        this.comments.set(testCode, []);
      }
      this.comments.get(testCode).push(newComment);

      // Notify other participants if in a shared session
      if (sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
          const otherParticipants = session.participants.filter(id => id !== userId);
          for (const participantId of otherParticipants) {
            await this.sendNotification(participantId, {
              type: 'new_comment',
              message: 'New comment added to shared test',
              testCode,
              commentId,
              sessionId
            });
          }
        }
      }

      return {
        success: true,
        comment: newComment
      };
    } catch (error) {
      console.error('Failed to add comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get comments for a test
  async getComments(testCode, sessionId = null) {
    try {
      const comments = this.comments.get(testCode) || [];
      
      // Filter by session if specified
      const filteredComments = sessionId 
        ? comments.filter(c => c.sessionId === sessionId)
        : comments;

      // Get user details for comments
      const userIds = [...new Set(filteredComments.map(c => c.userId))];
      const users = await User.find({ _id: { $in: userIds } }).select('firstName lastName email');
      const userMap = users.reduce((map, user) => {
        map[user._id] = user;
        return map;
      }, {});

      // Add user details to comments
      const commentsWithUsers = filteredComments.map(comment => ({
        ...comment,
        user: userMap[comment.userId] || { firstName: 'Unknown', lastName: '', email: 'unknown@example.com' }
      }));

      return {
        success: true,
        comments: commentsWithUsers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      };
    } catch (error) {
      console.error('Failed to get comments:', error);
      return { success: false, error: error.message };
    }
  }

  // Edit comment
  async editComment(commentId, userId, newComment) {
    try {
      let commentFound = false;
      
      for (const [testCode, comments] of this.comments.entries()) {
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
          if (comment.userId !== userId) {
            throw new Error('Not authorized to edit this comment');
          }
          
          comment.comment = newComment;
          comment.isEdited = true;
          comment.editedAt = new Date();
          commentFound = true;
          break;
        }
      }

      if (!commentFound) {
        throw new Error('Comment not found');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to edit comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete comment
  async deleteComment(commentId, userId) {
    try {
      let commentFound = false;
      
      for (const [testCode, comments] of this.comments.entries()) {
        const commentIndex = comments.findIndex(c => c.id === commentId);
        if (commentIndex !== -1) {
          const comment = comments[commentIndex];
          if (comment.userId !== userId) {
            throw new Error('Not authorized to delete this comment');
          }
          
          comments.splice(commentIndex, 1);
          commentFound = true;
          break;
        }
      }

      if (!commentFound) {
        throw new Error('Comment not found');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to delete comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Share test with specific users
  async shareTestWithUsers(testCode, ownerId, userIds, permissions = {}) {
    try {
      const test = await TestResult.findOne({ code: testCode });
      if (!test) {
        throw new Error('Test not found');
      }

      // Create individual share sessions for each user
      const shareResults = [];
      
      for (const userId of userIds) {
        const sessionResult = await this.createSharedSession(testCode, ownerId, {
          ...permissions,
          canView: true
        });
        
        if (sessionResult.success) {
          // Add user to session
          await this.joinSharedSession(sessionResult.sessionId, userId);
          
          // Send notification
          await this.sendNotification(userId, {
            type: 'test_shared',
            message: 'A test has been shared with you',
            testCode,
            sessionId: sessionResult.sessionId,
            ownerId
          });
          
          shareResults.push({
            userId,
            sessionId: sessionResult.sessionId,
            shareUrl: sessionResult.shareUrl
          });
        }
      }

      return {
        success: true,
        sharedWith: shareResults.length,
        results: shareResults
      };
    } catch (error) {
      console.error('Failed to share test:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's notifications
  async getUserNotifications(userId, limit = 20) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      const recentNotifications = userNotifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);

      return {
        success: true,
        notifications: recentNotifications
      };
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark notification as read
  async markNotificationAsRead(userId, notificationId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      const notification = userNotifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.isRead = true;
        notification.readAt = new Date();
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active sessions for a user
  async getUserSessions(userId) {
    try {
      const userSessions = [];
      
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.participants.includes(userId)) {
          userSessions.push({
            sessionId,
            testCode: session.testCode,
            ownerId: session.ownerId,
            createdAt: session.createdAt,
            isOwner: session.ownerId === userId,
            participantCount: session.participants.length
          });
        }
      }

      return {
        success: true,
        sessions: userSessions
      };
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return { success: false, error: error.message };
    }
  }

  // End a shared session
  async endSharedSession(sessionId, userId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.ownerId !== userId) {
        throw new Error('Not authorized to end this session');
      }

      session.isActive = false;
      
      // Notify participants
      for (const participantId of session.participants) {
        if (participantId !== userId) {
          await this.sendNotification(participantId, {
            type: 'session_ended',
            message: 'A shared test session has ended',
            sessionId
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to end shared session:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to user
  async sendNotification(userId, notification) {
    try {
      const notificationId = this.generateNotificationId();
      const fullNotification = {
        id: notificationId,
        userId,
        ...notification,
        createdAt: new Date(),
        isRead: false,
        readAt: null
      };

      if (!this.notifications.has(userId)) {
        this.notifications.set(userId, []);
      }
      
      this.notifications.get(userId).push(fullNotification);

      // Keep only last 100 notifications per user
      const userNotifications = this.notifications.get(userId);
      if (userNotifications.length > 100) {
        userNotifications.splice(0, userNotifications.length - 100);
      }

      return { success: true, notificationId };
    } catch (error) {
      console.error('Failed to send notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  generateCommentId() {
    return 'comment_' + Math.random().toString(36).substr(2, 9);
  }

  generateNotificationId() {
    return 'notif_' + Math.random().toString(36).substr(2, 9);
  }

  // Cleanup old data
  cleanupOldData() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Clean up old sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.createdAt < oneWeekAgo) {
        this.activeSessions.delete(sessionId);
      }
    }
    
    // Clean up old notifications
    for (const [userId, notifications] of this.notifications.entries()) {
      const recentNotifications = notifications.filter(n => n.createdAt > oneWeekAgo);
      this.notifications.set(userId, recentNotifications);
    }
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();

// Cleanup old data every hour
setInterval(() => {
  collaborationService.cleanupOldData();
}, 60 * 60 * 1000);

import { TestResult } from '../models/TestResult.js';

export class MachineLearningService {
  constructor() {
    this.model = null;
    this.isTrained = false;
    this.trainingData = [];
    this.features = [
      'subjectLength',
      'bodyLength',
      'hasImages',
      'hasLinks',
      'hasUnsubscribe',
      'senderReputation',
      'domainAge',
      'spamKeywords',
      'timeOfDay',
      'dayOfWeek'
    ];
  }

  // Extract features from email content
  extractFeatures(emailData) {
    const features = {};
    
    // Subject and body analysis
    features.subjectLength = emailData.subject?.length || 0;
    features.bodyLength = emailData.body?.length || 0;
    
    // Content analysis
    features.hasImages = /<img[^>]+>/i.test(emailData.body || '');
    features.hasLinks = /<a[^>]+href/i.test(emailData.body || '');
    features.hasUnsubscribe = /unsubscribe/i.test(emailData.body || '');
    
    // Spam keyword detection
    const spamKeywords = [
      'free', 'urgent', 'act now', 'limited time', 'click here',
      'winner', 'congratulations', 'cash', 'money', 'guarantee'
    ];
    features.spamKeywords = spamKeywords.filter(keyword => 
      (emailData.subject + ' ' + emailData.body).toLowerCase().includes(keyword)
    ).length;
    
    // Time-based features
    const now = new Date();
    features.timeOfDay = now.getHours();
    features.dayOfWeek = now.getDay();
    
    // Sender reputation (simulated)
    features.senderReputation = this.calculateSenderReputation(emailData.senderEmail);
    
    // Domain age (simulated)
    features.domainAge = this.calculateDomainAge(emailData.senderEmail);
    
    return features;
  }

  // Calculate sender reputation score
  calculateSenderReputation(senderEmail) {
    // Simulate reputation based on domain
    const domain = senderEmail?.split('@')[1] || '';
    const reputationDomains = {
      'gmail.com': 0.9,
      'outlook.com': 0.85,
      'yahoo.com': 0.8,
      'company.com': 0.7,
      'freemail.com': 0.5
    };
    return reputationDomains[domain] || 0.6;
  }

  // Calculate domain age (simulated)
  calculateDomainAge(senderEmail) {
    // Simulate domain age in days
    const domain = senderEmail?.split('@')[1] || '';
    const ageMap = {
      'gmail.com': 5000,
      'outlook.com': 4000,
      'yahoo.com': 4500,
      'company.com': 1000,
      'newdomain.com': 30
    };
    return ageMap[domain] || 365;
  }

  // Train the model with historical data
  async trainModel() {
    try {
      console.log('🤖 Training ML model...');
      
      // Get historical test results
      const historicalData = await TestResult.find({
        status: 'completed',
        result: { $exists: true, $not: { $size: 0 } }
      }).limit(1000);

      this.trainingData = [];
      
      for (const test of historicalData) {
        const features = this.extractFeatures({
          subject: `Test ${test.code}`,
          body: 'Test email content',
          senderEmail: test.userEmail
        });
        
        // Calculate average score as target
        const avgScore = test.result.reduce((sum, r) => {
          const score = r.placement === 'Inbox' ? 1 : r.placement === 'Promotions' ? 0.5 : 0;
          return sum + score;
        }, 0) / test.result.length;
        
        this.trainingData.push({
          features,
          target: avgScore
        });
      }
      
      // Simple linear regression model
      this.model = this.trainLinearRegression(this.trainingData);
      this.isTrained = true;
      
      console.log(`✅ ML model trained with ${this.trainingData.length} samples`);
      return { success: true, samples: this.trainingData.length };
    } catch (error) {
      console.error('❌ Failed to train ML model:', error);
      return { success: false, error: error.message };
    }
  }

  // Simple linear regression training
  trainLinearRegression(data) {
    const n = data.length;
    const features = this.features;
    
    // Initialize weights
    const weights = {};
    features.forEach(feature => {
      weights[feature] = Math.random() * 0.1 - 0.05;
    });
    weights.bias = Math.random() * 0.1 - 0.05;
    
    // Training parameters
    const learningRate = 0.01;
    const epochs = 100;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;
      
      for (const sample of data) {
        // Predict
        const prediction = this.predict(sample.features, weights);
        const error = sample.target - prediction;
        totalError += Math.abs(error);
        
        // Update weights
        features.forEach(feature => {
          weights[feature] += learningRate * error * sample.features[feature];
        });
        weights.bias += learningRate * error;
      }
      
      if (epoch % 20 === 0) {
        console.log(`Epoch ${epoch}, Error: ${(totalError / n).toFixed(4)}`);
      }
    }
    
    return weights;
  }

  // Make prediction
  predict(features, weights = this.model) {
    if (!weights) return 0.5; // Default prediction
    
    let prediction = weights.bias;
    this.features.forEach(feature => {
      prediction += weights[feature] * (features[feature] || 0);
    });
    
    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, prediction));
  }

  // Predict deliverability score
  async predictDeliverability(emailData) {
    if (!this.isTrained) {
      await this.trainModel();
    }
    
    const features = this.extractFeatures(emailData);
    const prediction = this.predict(features);
    
    return {
      predictedScore: Math.round(prediction * 100),
      confidence: this.calculateConfidence(features),
      features: this.analyzeFeatures(features),
      recommendations: this.generateRecommendations(features)
    };
  }

  // Calculate prediction confidence
  calculateConfidence(features) {
    // Simple confidence based on feature completeness
    const totalFeatures = this.features.length;
    const presentFeatures = this.features.filter(f => features[f] !== undefined).length;
    return Math.round((presentFeatures / totalFeatures) * 100);
  }

  // Analyze features for insights
  analyzeFeatures(features) {
    const analysis = {
      strengths: [],
      weaknesses: [],
      riskFactors: []
    };
    
    // Subject length analysis
    if (features.subjectLength > 50) {
      analysis.weaknesses.push('Subject line is too long');
    } else if (features.subjectLength < 10) {
      analysis.weaknesses.push('Subject line is too short');
    } else {
      analysis.strengths.push('Good subject line length');
    }
    
    // Spam keyword analysis
    if (features.spamKeywords > 2) {
      analysis.riskFactors.push('Contains multiple spam keywords');
    } else if (features.spamKeywords === 0) {
      analysis.strengths.push('No spam keywords detected');
    }
    
    // Content analysis
    if (features.hasUnsubscribe) {
      analysis.strengths.push('Includes unsubscribe link');
    }
    
    if (features.hasImages && !features.bodyLength) {
      analysis.weaknesses.push('Image-only content may trigger spam filters');
    }
    
    // Sender reputation
    if (features.senderReputation > 0.8) {
      analysis.strengths.push('Good sender reputation');
    } else if (features.senderReputation < 0.5) {
      analysis.riskFactors.push('Low sender reputation');
    }
    
    return analysis;
  }

  // Generate recommendations
  generateRecommendations(features) {
    const recommendations = [];
    
    if (features.subjectLength > 50) {
      recommendations.push('Shorten subject line to under 50 characters');
    }
    
    if (features.spamKeywords > 0) {
      recommendations.push('Remove or replace spam trigger words');
    }
    
    if (!features.hasUnsubscribe) {
      recommendations.push('Add unsubscribe link for compliance');
    }
    
    if (features.bodyLength < 100) {
      recommendations.push('Add more content to avoid spam filters');
    }
    
    if (features.senderReputation < 0.7) {
      recommendations.push('Improve sender reputation through consistent sending');
    }
    
    return recommendations;
  }

  // Get model performance metrics
  async getModelPerformance() {
    if (!this.isTrained) {
      return { error: 'Model not trained yet' };
    }
    
    // Calculate accuracy on training data
    let correctPredictions = 0;
    let totalPredictions = 0;
    
    for (const sample of this.trainingData) {
      const prediction = this.predict(sample.features);
      const actual = sample.target;
      
      // Consider prediction correct if within 20% of actual
      if (Math.abs(prediction - actual) < 0.2) {
        correctPredictions++;
      }
      totalPredictions++;
    }
    
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
    
    return {
      isTrained: this.isTrained,
      trainingSamples: this.trainingData.length,
      accuracy: Math.round(accuracy),
      features: this.features.length,
      lastTrained: new Date().toISOString()
    };
  }

  // Retrain model with new data
  async retrainModel() {
    console.log('🔄 Retraining ML model...');
    this.isTrained = false;
    return await this.trainModel();
  }
}

// Singleton instance
export const mlService = new MachineLearningService();

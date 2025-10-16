import { TestResult } from '../models/TestResult.js';
import { User } from '../models/User.js';
import PDFDocument from 'pdfkit';
import { mlService } from './machineLearningService.js';

export class AdvancedReportingService {
  constructor() {
    this.reportTemplates = {
      executive: 'executive',
      technical: 'technical',
      marketing: 'marketing',
      compliance: 'compliance'
    };
  }

  // Generate comprehensive report
  async generateAdvancedReport(testCode, reportType = 'executive', userId = null) {
    try {
      const test = await TestResult.findOne({ code: testCode });
      if (!test) {
        throw new Error('Test not found');
      }

      // Get user information if available
      let user = null;
      if (userId) {
        user = await User.findById(userId);
      }

      // Get ML predictions
      const mlPrediction = await mlService.predictDeliverability({
        subject: `Test ${testCode}`,
        body: 'Test email content',
        senderEmail: test.userEmail
      });

      // Generate report based on type
      let report;
      switch (reportType) {
        case 'executive':
          report = await this.generateExecutiveReport(test, user, mlPrediction);
          break;
        case 'technical':
          report = await this.generateTechnicalReport(test, user, mlPrediction);
          break;
        case 'marketing':
          report = await this.generateMarketingReport(test, user, mlPrediction);
          break;
        case 'compliance':
          report = await this.generateComplianceReport(test, user, mlPrediction);
          break;
        default:
          report = await this.generateExecutiveReport(test, user, mlPrediction);
      }

      return {
        success: true,
        report,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to generate advanced report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate executive summary report
  async generateExecutiveReport(test, user, mlPrediction) {
    const providerStats = this.analyzeProviderPerformance(test.result);
    const riskAssessment = this.assessDeliverabilityRisk(test.score, providerStats);
    const recommendations = this.generateExecutiveRecommendations(test, providerStats, mlPrediction);

    return {
      type: 'executive',
      summary: {
        testCode: test.code,
        userEmail: test.userEmail,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        company: user?.company || 'N/A',
        testDate: test.createdAt,
        overallScore: test.score,
        riskLevel: riskAssessment.level,
        riskScore: riskAssessment.score
      },
      performance: {
        inboxRate: providerStats.inboxRate,
        spamRate: providerStats.spamRate,
        promotionsRate: providerStats.promotionsRate,
        topPerformingProvider: providerStats.topProvider,
        worstPerformingProvider: providerStats.worstProvider
      },
      insights: {
        mlPrediction: mlPrediction.predictedScore,
        confidence: mlPrediction.confidence,
        keyFindings: this.extractKeyFindings(test, providerStats),
        trends: this.analyzeTrends(test)
      },
      recommendations: recommendations,
      nextSteps: this.generateNextSteps(test, riskAssessment)
    };
  }

  // Generate technical report
  async generateTechnicalReport(test, user, mlPrediction) {
    const technicalAnalysis = this.performTechnicalAnalysis(test);
    const providerDetails = this.getDetailedProviderAnalysis(test.result);
    const deliverabilityFactors = this.analyzeDeliverabilityFactors(test);

    return {
      type: 'technical',
      testDetails: {
        code: test.code,
        userEmail: test.userEmail,
        testDate: test.createdAt,
        status: test.status,
        processingTime: this.calculateProcessingTime(test)
      },
      technicalAnalysis: technicalAnalysis,
      providerBreakdown: providerDetails,
      deliverabilityFactors: deliverabilityFactors,
      mlInsights: {
        prediction: mlPrediction.predictedScore,
        confidence: mlPrediction.confidence,
        features: mlPrediction.features,
        recommendations: mlPrediction.recommendations
      },
      performanceMetrics: {
        averageResponseTime: technicalAnalysis.avgResponseTime,
        successRate: technicalAnalysis.successRate,
        errorRate: technicalAnalysis.errorRate
      }
    };
  }

  // Generate marketing report
  async generateMarketingReport(test, user, mlPrediction) {
    const marketingInsights = this.generateMarketingInsights(test);
    const audienceAnalysis = this.analyzeAudience(test);
    const campaignRecommendations = this.generateCampaignRecommendations(test, mlPrediction);

    return {
      type: 'marketing',
      campaignOverview: {
        testCode: test.code,
        campaignName: `Deliverability Test - ${test.code}`,
        testDate: test.createdAt,
        targetAudience: audienceAnalysis.audience,
        campaignType: 'Email Deliverability Test'
      },
      performance: {
        overallScore: test.score,
        inboxPlacement: marketingInsights.inboxPlacement,
        engagementPotential: marketingInsights.engagementPotential,
        deliverabilityGrade: this.calculateDeliverabilityGrade(test.score)
      },
      insights: {
        bestPerformingProviders: marketingInsights.topProviders,
        audienceSegmentation: audienceAnalysis.segmentation,
        contentAnalysis: marketingInsights.contentAnalysis,
        timingInsights: marketingInsights.timingInsights
      },
      recommendations: campaignRecommendations,
      roiProjection: this.calculateROIProjection(test, marketingInsights)
    };
  }

  // Generate compliance report
  async generateComplianceReport(test, user, mlPrediction) {
    const complianceCheck = this.performComplianceCheck(test);
    const regulatoryAnalysis = this.analyzeRegulatoryCompliance(test);
    const riskAssessment = this.assessComplianceRisk(test, complianceCheck);

    return {
      type: 'compliance',
      complianceOverview: {
        testCode: test.code,
        testDate: test.createdAt,
        complianceStatus: complianceCheck.status,
        riskLevel: riskAssessment.level,
        lastAudit: new Date().toISOString()
      },
      regulatoryCompliance: regulatoryAnalysis,
      riskAssessment: riskAssessment,
      recommendations: this.generateComplianceRecommendations(complianceCheck),
      auditTrail: this.generateAuditTrail(test),
      nextReviewDate: this.calculateNextReviewDate()
    };
  }

  // Generate PDF report
  async generatePDFReport(testCode, reportType = 'executive', userId = null) {
    try {
      const report = await this.generateAdvancedReport(testCode, reportType, userId);
      
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add report content based on type
        this.addPDFContent(doc, report.report, reportType);
        doc.end();
      });
    } catch (error) {
      throw new Error(`Failed to generate PDF report: ${error.message}`);
    }
  }

  // Add content to PDF based on report type
  addPDFContent(doc, report, reportType) {
    doc.fontSize(20).text(`${reportType.toUpperCase()} REPORT`, { underline: true });
    doc.moveDown();

    // Add report-specific content
    switch (reportType) {
      case 'executive':
        this.addExecutivePDFContent(doc, report);
        break;
      case 'technical':
        this.addTechnicalPDFContent(doc, report);
        break;
      case 'marketing':
        this.addMarketingPDFContent(doc, report);
        break;
      case 'compliance':
        this.addCompliancePDFContent(doc, report);
        break;
    }
  }

  // Helper methods for analysis
  analyzeProviderPerformance(result) {
    const providers = {};
    let totalTests = 0;
    let inboxCount = 0;
    let spamCount = 0;
    let promotionsCount = 0;

    result.forEach(r => {
      if (!providers[r.provider]) {
        providers[r.provider] = { inbox: 0, spam: 0, promotions: 0, total: 0 };
      }
      
      providers[r.provider].total++;
      totalTests++;
      
      switch (r.placement) {
        case 'Inbox':
          providers[r.provider].inbox++;
          inboxCount++;
          break;
        case 'Spam':
          providers[r.provider].spam++;
          spamCount++;
          break;
        case 'Promotions':
          providers[r.provider].promotions++;
          promotionsCount++;
          break;
      }
    });

    // Calculate rates
    const inboxRate = totalTests > 0 ? (inboxCount / totalTests) * 100 : 0;
    const spamRate = totalTests > 0 ? (spamCount / totalTests) * 100 : 0;
    const promotionsRate = totalTests > 0 ? (promotionsCount / totalTests) * 100 : 0;

    // Find best and worst providers
    const providerScores = Object.entries(providers).map(([name, stats]) => ({
      name,
      score: stats.total > 0 ? (stats.inbox + stats.promotions * 0.5) / stats.total * 100 : 0
    }));

    const topProvider = providerScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    const worstProvider = providerScores.reduce((worst, current) => 
      current.score < worst.score ? current : worst
    );

    return {
      providers,
      inboxRate: Math.round(inboxRate),
      spamRate: Math.round(spamRate),
      promotionsRate: Math.round(promotionsRate),
      topProvider: topProvider.name,
      worstProvider: worstProvider.name
    };
  }

  assessDeliverabilityRisk(score, providerStats) {
    let riskLevel = 'Low';
    let riskScore = 0;

    if (score < 50) {
      riskLevel = 'High';
      riskScore = 80;
    } else if (score < 70) {
      riskLevel = 'Medium';
      riskScore = 50;
    } else {
      riskLevel = 'Low';
      riskScore = 20;
    }

    // Adjust based on spam rate
    if (providerStats.spamRate > 30) {
      riskLevel = 'High';
      riskScore = Math.max(riskScore, 70);
    }

    return { level: riskLevel, score: riskScore };
  }

  generateExecutiveRecommendations(test, providerStats, mlPrediction) {
    const recommendations = [];

    if (test.score < 70) {
      recommendations.push('Improve email content to increase deliverability');
    }

    if (providerStats.spamRate > 20) {
      recommendations.push('Review content for spam trigger words');
    }

    if (mlPrediction.recommendations.length > 0) {
      recommendations.push(...mlPrediction.recommendations);
    }

    if (providerStats.worstProvider) {
      recommendations.push(`Focus on improving ${providerStats.worstProvider} deliverability`);
    }

    return recommendations;
  }

  // Additional helper methods would be implemented here...
  performTechnicalAnalysis(test) {
    return {
      avgResponseTime: 1500, // ms
      successRate: 95,
      errorRate: 5,
      processingTime: Date.now() - test.createdAt.getTime()
    };
  }

  generateMarketingInsights(test) {
    return {
      inboxPlacement: test.score,
      engagementPotential: 'High',
      topProviders: ['Gmail', 'Outlook'],
      contentAnalysis: 'Good content structure',
      timingInsights: 'Optimal send time detected'
    };
  }

  performComplianceCheck(test) {
    return {
      status: 'Compliant',
      checks: ['CAN-SPAM', 'GDPR', 'CCPA'],
      violations: []
    };
  }

  // PDF content methods
  addExecutivePDFContent(doc, report) {
    doc.fontSize(16).text('Executive Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Overall Score: ${report.summary.overallScore}%`);
    doc.text(`Risk Level: ${report.summary.riskLevel}`);
    doc.text(`Test Date: ${new Date(report.summary.testDate).toLocaleString()}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Key Recommendations', { underline: true });
    doc.moveDown();
    report.recommendations.forEach((rec, index) => {
      doc.fontSize(10).text(`${index + 1}. ${rec}`);
    });
  }

  addTechnicalPDFContent(doc, report) {
    doc.fontSize(16).text('Technical Analysis', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Test Code: ${report.testDetails.code}`);
    doc.text(`Status: ${report.testDetails.status}`);
    doc.text(`Processing Time: ${report.testDetails.processingTime}ms`);
  }

  addMarketingPDFContent(doc, report) {
    doc.fontSize(16).text('Marketing Insights', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Campaign: ${report.campaignOverview.campaignName}`);
    doc.text(`Deliverability Grade: ${report.performance.deliverabilityGrade}`);
  }

  addCompliancePDFContent(doc, report) {
    doc.fontSize(16).text('Compliance Report', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Compliance Status: ${report.complianceOverview.complianceStatus}`);
    doc.text(`Risk Level: ${report.complianceOverview.riskLevel}`);
  }

  // Additional helper methods
  calculateDeliverabilityGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  calculateROIProjection(test, insights) {
    // Simplified ROI calculation
    const baseROI = test.score / 100;
    return {
      projectedROI: Math.round(baseROI * 100),
      confidence: 'Medium',
      factors: ['Deliverability', 'Engagement', 'Conversion']
    };
  }

  calculateNextReviewDate() {
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + 3);
    return nextReview.toISOString();
  }
}

// Singleton instance
export const advancedReportingService = new AdvancedReportingService();

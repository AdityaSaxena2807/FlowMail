const Flow = require('../models/Flow');
const agendaService = require('../services/agendaService');

// @desc    Create a new flow
// @route   POST /api/flows
// @access  Private
exports.createFlow = async (req, res) => {
  try {
    // Add user to request body
    req.body.user = req.user.id;
    
    const flow = await Flow.create(req.body);
    
    res.status(201).json({
      success: true,
      data: flow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all flows for current user
// @route   GET /api/flows
// @access  Private
exports.getFlows = async (req, res) => {
  try {
    const flows = await Flow.find({ user: req.user.id });
    
    res.status(200).json({
      success: true,
      count: flows.length,
      data: flows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single flow
// @route   GET /api/flows/:id
// @access  Private
exports.getFlow = async (req, res) => {
  try {
    const flow = await Flow.findById(req.params.id);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: `Flow not found with id of ${req.params.id}`,
      });
    }
    
    // Make sure user owns the flow
    if (flow.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this flow`,
      });
    }
    
    res.status(200).json({
      success: true,
      data: flow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update flow
// @route   PUT /api/flows/:id
// @access  Private
exports.updateFlow = async (req, res) => {
  try {
    let flow = await Flow.findById(req.params.id);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: `Flow not found with id of ${req.params.id}`,
      });
    }
    
    // Make sure user owns the flow
    if (flow.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this flow`,
      });
    }
    
    // If the flow is active, we need to cancel all scheduled emails
    if (flow.isActive) {
      await agendaService.cancelScheduledEmails(flow._id);
    }
    
    flow = await Flow.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    res.status(200).json({
      success: true,
      data: flow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete flow
// @route   DELETE /api/flows/:id
// @access  Private
exports.deleteFlow = async (req, res) => {
  try {
    const flow = await Flow.findById(req.params.id);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: `Flow not found with id of ${req.params.id}`,
      });
    }
    
    // Make sure user owns the flow
    if (flow.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this flow`,
      });
    }
    
    // Cancel any scheduled emails
    await agendaService.cancelScheduledEmails(flow._id);
    
    await flow.remove();
    
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Activate flow and schedule emails
// @route   POST /api/flows/:id/activate
// @access  Private
exports.activateFlow = async (req, res) => {
  try {
    const flow = await Flow.findById(req.params.id);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: `Flow not found with id of ${req.params.id}`,
      });
    }
    
    // Make sure user owns the flow
    if (flow.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to activate this flow`,
      });
    }
    
    // Schedule emails based on the flow configuration
    await scheduleEmailsForFlow(flow);
    
    // Update flow status
    flow.isActive = true;
    flow.executionStatus = 'scheduled';
    await flow.save();
    
    res.status(200).json({
      success: true,
      data: flow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Deactivate flow and cancel scheduled emails
// @route   POST /api/flows/:id/deactivate
// @access  Private
exports.deactivateFlow = async (req, res) => {
  try {
    const flow = await Flow.findById(req.params.id);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: `Flow not found with id of ${req.params.id}`,
      });
    }
    
    // Make sure user owns the flow
    if (flow.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to deactivate this flow`,
      });
    }
    
    // Cancel all scheduled emails
    await agendaService.cancelScheduledEmails(flow._id);
    
    // Update flow status
    flow.isActive = false;
    flow.executionStatus = 'draft';
    await flow.save();
    
    res.status(200).json({
      success: true,
      data: flow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Schedule a single email (for testing)
// @route   POST /api/email/schedule
// @access  Private
exports.scheduleEmail = async (req, res) => {
  try {
    const { to, subject, html, delay = '1h' } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Please provide to, subject, and html fields',
      });
    }
    
    const result = await agendaService.scheduleEmail(
      to,
      subject,
      html,
      delay,
      null, // flowId
      null  // nodeId
    );
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to schedule emails for a flow
const scheduleEmailsForFlow = async (flow) => {
  // First, let's build a graph from the flow nodes and edges
  const graph = buildGraph(flow.nodes, flow.edges);
  
  // Find start nodes (those without incoming edges)
  const startNodes = flow.nodes.filter(node => 
    !flow.edges.some(edge => edge.target === node.id)
  );
  
  // For each start node, traverse the graph and schedule emails
  for (const startNode of startNodes) {
    await traverseAndSchedule(startNode, graph, flow._id, 0);
  }
  
  return true;
};

// Helper to build a graph from nodes and edges
const buildGraph = (nodes, edges) => {
  const graph = {};
  
  // Initialize all nodes with empty children arrays
  nodes.forEach(node => {
    graph[node.id] = {
      ...node.toObject(),
      children: []
    };
  });
  
  // Add children based on edges
  edges.forEach(edge => {
    if (graph[edge.source]) {
      graph[edge.source].children.push(edge.target);
    }
  });
  
  return graph;
};

// Helper to traverse the graph and schedule emails
const traverseAndSchedule = async (node, graph, flowId, cumulativeDelay = 0) => {
  const nodeObj = graph[node.id];
  
  if (!nodeObj) return;
  
  let currentDelay = cumulativeDelay;
  
  // Handle different node types
  if (nodeObj.type === 'wait') {
    // Parse the delay value and add to cumulative delay
    const delayStr = nodeObj.data.delay || '0m';
    let delayMs = 0;
    
    if (delayStr.includes('m')) {
      delayMs = parseInt(delayStr) * 60 * 1000;
    } else if (delayStr.includes('h')) {
      delayMs = parseInt(delayStr) * 60 * 60 * 1000;
    } else if (delayStr.includes('d')) {
      delayMs = parseInt(delayStr) * 24 * 60 * 60 * 1000;
    }
    
    currentDelay += delayMs;
  } else if (nodeObj.type === 'coldEmail' && nodeObj.data.email) {
    // Schedule an email with the cumulative delay
    await agendaService.scheduleEmail(
      nodeObj.data.email.to,
      nodeObj.data.email.subject,
      nodeObj.data.email.body,
      currentDelay,
      flowId,
      nodeObj.id
    );
  }
  
  // Recursively process child nodes
  for (const childId of nodeObj.children) {
    await traverseAndSchedule(graph[childId], graph, flowId, currentDelay);
  }
};
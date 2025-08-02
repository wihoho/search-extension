// OmniSearch Content Script
// Detects search functionality on websites for smart shortcut creation

(function() {
    'use strict';

    // Debug logging
    const DEBUG = false;
    function debugLog(...args) {
        if (DEBUG) {
            console.log('OmniSearch Content:', ...args);
        }
    }

    debugLog('Content script loaded on:', window.location.href);

    // Search detection results
    let detectionResults = null;

    /**
     * Detect search functionality on the current page
     */
    function detectSearchFunctionality() {
        const results = {
            hasSearch: false,
            searchForms: [],
            searchInputs: [],
            searchUrls: [],
            suggestedKeyword: '',
            websiteName: '',
            confidence: 0
        };

        try {
            // Get website info
            results.websiteName = getWebsiteName();
            results.suggestedKeyword = generateKeyword();

            // Method 1: Detect search forms
            const forms = detectSearchForms();
            results.searchForms = forms;

            // Method 2: Detect standalone search inputs
            const inputs = detectSearchInputs();
            results.searchInputs = inputs;

            // Method 3: Analyze URL patterns for existing search functionality
            const urlPatterns = analyzeUrlPatterns();
            results.searchUrls = urlPatterns;

            // Method 4: Look for common search elements
            const commonElements = detectCommonSearchElements();

            // Calculate confidence and determine if search is available
            results.confidence = calculateConfidence(forms, inputs, urlPatterns, commonElements);
            results.hasSearch = results.confidence > 0.3;

            debugLog('Detection results:', results);
            return results;

        } catch (error) {
            console.error('OmniSearch: Error detecting search functionality:', error);
            return results;
        }
    }

    /**
     * Detect search forms on the page
     */
    function detectSearchForms() {
        const forms = [];
        const formElements = document.querySelectorAll('form');

        formElements.forEach(form => {
            const searchInputs = form.querySelectorAll('input[type="search"], input[name*="search"], input[name*="query"], input[name*="q"], input[placeholder*="search" i]');
            
            if (searchInputs.length > 0) {
                const formData = {
                    action: form.action || window.location.href,
                    method: form.method || 'GET',
                    inputs: []
                };

                searchInputs.forEach(input => {
                    formData.inputs.push({
                        name: input.name || 'q',
                        type: input.type,
                        placeholder: input.placeholder,
                        value: input.value
                    });
                });

                forms.push(formData);
            }
        });

        return forms;
    }

    /**
     * Detect standalone search inputs (not in forms)
     */
    function detectSearchInputs() {
        const inputs = [];
        const searchInputs = document.querySelectorAll('input[type="search"]:not(form input), input[placeholder*="search" i]:not(form input)');

        searchInputs.forEach(input => {
            inputs.push({
                name: input.name || 'q',
                type: input.type,
                placeholder: input.placeholder,
                id: input.id,
                className: input.className
            });
        });

        return inputs;
    }

    /**
     * Analyze current URL and page for search patterns
     */
    function analyzeUrlPatterns() {
        const patterns = [];
        const currentUrl = window.location.href;
        const hostname = window.location.hostname;

        // Check if current page is a search results page
        const searchIndicators = ['search', 'query', 'q=', 'find', 'results'];
        const isSearchPage = searchIndicators.some(indicator => 
            currentUrl.toLowerCase().includes(indicator)
        );

        if (isSearchPage) {
            // Try to extract search pattern from current URL
            const pattern = extractSearchPattern(currentUrl);
            if (pattern) {
                patterns.push(pattern);
            }
        }

        // Look for common search URL patterns based on the website
        const commonPatterns = getCommonSearchPatterns(hostname);
        patterns.push(...commonPatterns);

        return patterns;
    }

    /**
     * Extract search pattern from a search results URL
     */
    function extractSearchPattern(url) {
        try {
            const urlObj = new URL(url);
            const params = urlObj.searchParams;

            // Common search parameter names
            const searchParams = ['q', 'query', 'search', 'term', 'keyword', 's'];
            
            for (const param of searchParams) {
                if (params.has(param)) {
                    // Create pattern by replacing the search term with %s
                    const searchTerm = params.get(param);
                    if (searchTerm) {
                        const pattern = url.replace(encodeURIComponent(searchTerm), '%s');
                        return {
                            url: pattern,
                            parameter: param,
                            method: 'GET',
                            confidence: 0.8
                        };
                    }
                }
            }
        } catch (error) {
            debugLog('Error extracting search pattern:', error);
        }
        return null;
    }

    /**
     * Get common search patterns for known websites
     */
    function getCommonSearchPatterns(hostname) {
        const patterns = [];
        const domain = hostname.replace('www.', '');

        // Known patterns for popular sites
        const knownPatterns = {
            'reddit.com': [
                { url: `https://www.reddit.com/search/?q=%s`, confidence: 0.9 },
                { url: `https://www.reddit.com/r/all/search/?q=%s`, confidence: 0.7 }
            ],
            'stackoverflow.com': [
                { url: `https://stackoverflow.com/search?q=%s`, confidence: 0.9 }
            ],
            'medium.com': [
                { url: `https://medium.com/search?q=%s`, confidence: 0.9 }
            ],
            'pinterest.com': [
                { url: `https://www.pinterest.com/search/pins/?q=%s`, confidence: 0.9 }
            ],
            'etsy.com': [
                { url: `https://www.etsy.com/search?q=%s`, confidence: 0.9 }
            ],
            'linkedin.com': [
                { url: `https://www.linkedin.com/search/results/all/?keywords=%s`, confidence: 0.9 }
            ],
            'indeed.com': [
                { url: `https://www.indeed.com/jobs?q=%s`, confidence: 0.9 }
            ],
            'glassdoor.com': [
                { url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=%s`, confidence: 0.9 }
            ],
            'craigslist.org': [
                { url: `https://craigslist.org/search/sss?query=%s`, confidence: 0.8 }
            ],
            'ebay.com': [
                { url: `https://www.ebay.com/sch/i.html?_nkw=%s`, confidence: 0.9 }
            ],
            'aliexpress.com': [
                { url: `https://www.aliexpress.com/wholesale?SearchText=%s`, confidence: 0.9 }
            ],
            'booking.com': [
                { url: `https://www.booking.com/searchresults.html?ss=%s`, confidence: 0.9 }
            ],
            'airbnb.com': [
                { url: `https://www.airbnb.com/s/%s`, confidence: 0.9 }
            ],
            'yelp.com': [
                { url: `https://www.yelp.com/search?find_desc=%s`, confidence: 0.9 }
            ],
            'tripadvisor.com': [
                { url: `https://www.tripadvisor.com/Search?q=%s`, confidence: 0.9 }
            ],
            'quora.com': [
                { url: `https://www.quora.com/search?q=%s`, confidence: 0.9 }
            ],
            'discord.com': [
                { url: `https://discord.com/channels/@me?search=%s`, confidence: 0.8 }
            ],
            'slack.com': [
                { url: `https://slack.com/intl/en-in/help/articles/202528808-Search-in-Slack#search-from-your-browser`, confidence: 0.6 }
            ]
        };

        if (knownPatterns[domain]) {
            patterns.push(...knownPatterns[domain]);
        }

        // Generic patterns to try
        const genericPatterns = [
            { url: `https://${hostname}/search?q=%s`, confidence: 0.4 },
            { url: `https://${hostname}/search/?q=%s`, confidence: 0.4 },
            { url: `https://${hostname}/?s=%s`, confidence: 0.3 },
            { url: `https://${hostname}/?search=%s`, confidence: 0.3 }
        ];

        patterns.push(...genericPatterns);
        return patterns;
    }

    /**
     * Detect common search elements and patterns
     */
    function detectCommonSearchElements() {
        const elements = {
            searchButtons: 0,
            searchIcons: 0,
            searchText: 0
        };

        // Look for search buttons
        const searchButtons = document.querySelectorAll('button[type="submit"], input[type="submit"], button');
        searchButtons.forEach(button => {
            const text = (button.textContent || button.value || '').toLowerCase();
            if (text.includes('search') || text.includes('find') || text.includes('go')) {
                elements.searchButtons++;
            }
        });

        // Look for search icons (common classes/IDs)
        const searchIconSelectors = [
            '.search-icon', '.fa-search', '.icon-search', 
            '[class*="search"]', '[id*="search"]'
        ];
        
        searchIconSelectors.forEach(selector => {
            const icons = document.querySelectorAll(selector);
            elements.searchIcons += icons.length;
        });

        // Look for search-related text
        const searchText = document.body.textContent.toLowerCase();
        const searchTerms = ['search', 'find', 'discover', 'explore'];
        searchTerms.forEach(term => {
            const matches = (searchText.match(new RegExp(term, 'g')) || []).length;
            elements.searchText += matches;
        });

        return elements;
    }

    /**
     * Calculate confidence score for search detection
     */
    function calculateConfidence(forms, inputs, urlPatterns, commonElements) {
        let confidence = 0;

        // Forms with search inputs (high confidence)
        confidence += forms.length * 0.4;

        // Standalone search inputs (medium confidence)
        confidence += inputs.length * 0.2;

        // URL patterns (varies by confidence)
        urlPatterns.forEach(pattern => {
            confidence += (pattern.confidence || 0.3) * 0.3;
        });

        // Common elements (low confidence boost)
        confidence += Math.min(commonElements.searchButtons * 0.1, 0.2);
        confidence += Math.min(commonElements.searchIcons * 0.05, 0.1);
        confidence += Math.min(commonElements.searchText * 0.01, 0.1);

        return Math.min(confidence, 1.0);
    }

    /**
     * Get website name from various sources
     */
    function getWebsiteName() {
        // Try to get name from title
        let name = document.title;

        // Try to get from meta tags
        const siteName = document.querySelector('meta[property="og:site_name"]');
        if (siteName) {
            name = siteName.content;
        }

        // Try to get from application name
        const appName = document.querySelector('meta[name="application-name"]');
        if (appName) {
            name = appName.content;
        }

        // Fallback to hostname
        if (!name || name.length > 50) {
            name = window.location.hostname.replace('www.', '');
        }

        return name;
    }

    /**
     * Generate suggested keyword from domain
     */
    function generateKeyword() {
        const hostname = window.location.hostname.replace('www.', '');
        const parts = hostname.split('.');
        
        // Use the main domain part (before .com, .org, etc.)
        let keyword = parts[0];

        // Clean up the keyword
        keyword = keyword.toLowerCase();
        keyword = keyword.replace(/[^a-z0-9]/g, '');
        
        // Limit length
        if (keyword.length > 15) {
            keyword = keyword.substring(0, 15);
        }

        return keyword;
    }

    /**
     * Get the best search URL suggestion
     */
    function getBestSearchUrl() {
        if (!detectionResults) return null;

        // Prefer form-based detection
        if (detectionResults.searchForms.length > 0) {
            const form = detectionResults.searchForms[0];
            const input = form.inputs[0];
            
            if (form.method.toUpperCase() === 'GET') {
                const url = new URL(form.action);
                url.searchParams.set(input.name, '%s');
                return url.toString();
            }
        }

        // Use URL patterns with highest confidence
        if (detectionResults.searchUrls.length > 0) {
            const bestPattern = detectionResults.searchUrls
                .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
            return bestPattern.url;
        }

        return null;
    }

    // Message listener for communication with popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'detectSearch') {
            debugLog('Received detectSearch request');
            detectionResults = detectSearchFunctionality();
            
            const response = {
                ...detectionResults,
                bestSearchUrl: getBestSearchUrl()
            };
            
            sendResponse(response);
        }
    });

    // Auto-detect on page load (optional - can be enabled for better UX)
    // detectionResults = detectSearchFunctionality();

})();

import math

class EloSystem:
    def __init__(self, k_factor=32):
        """
        Initialize Elo rating system
        k_factor: Maximum change in rating per game (32 is standard for chess)
        """
        self.k_factor = k_factor
    
    def expected_score(self, rating_a, rating_b):
        """
        Calculate expected score for player A against player B
        Returns a value between 0 and 1
        """
        return 1 / (1 + math.pow(10, (rating_b - rating_a) / 400))
    
    def calculate_new_ratings(self, rater_rating, rated_rating, user_rating, outcome):
        """
        Calculate new Elo ratings after an interaction
        
        Args:
            rater_rating: Current Elo rating of the person giving the rating
            rated_rating: Current Elo rating of the person being rated
            user_rating: The rating given (1-10 scale)
            outcome: Boolean indicating if it was a match (True) or skip (False)
        
        Returns:
            tuple: (new_rater_rating, new_rated_rating)
        """
        # Convert user rating (1-10) to a score (0-1)
        # More nuanced conversion: 1-4 = negative, 5-6 = neutral, 7-10 = positive
        if user_rating <= 4:
            normalized_score = (user_rating - 1) / 9  # 0 to 0.33
        elif user_rating <= 6:
            normalized_score = 0.5  # Neutral
        else:
            normalized_score = 0.5 + (user_rating - 6) * 0.125  # 0.625 to 1.0
        
        # Calculate expected scores
        expected_rater = self.expected_score(rater_rating, rated_rating)
        expected_rated = self.expected_score(rated_rating, rater_rating)
        
        # Actual score based on the rating given and match status
        if outcome:  # Match (like/super like)
            # Rater gets points for successful matching
            if user_rating >= 8:
                actual_rater_score = 1.0  # High rating match = full points
            elif user_rating >= 6:
                actual_rater_score = 0.8  # Medium rating match = good points
            else:
                actual_rater_score = 0.6  # Low rating but still matched
            
            # Rated person gets points based on rating + match bonus
            actual_rated_score = min(1.0, normalized_score + 0.2)  # Match bonus
            
        else:  # Skip/Pass
            # Rater gets neutral points for providing rating
            actual_rater_score = 0.5
            
            # Rated person gets points purely based on rating received
            actual_rated_score = normalized_score
        
        # Apply different K-factors based on rating confidence
        # Higher rated players have more stable ratings
        rater_k = self.k_factor * (1.0 if rater_rating < 1400 else 0.8 if rater_rating < 1800 else 0.6)
        rated_k = self.k_factor * (1.0 if rated_rating < 1400 else 0.8 if rated_rating < 1800 else 0.6)
        
        # Calculate new ratings
        new_rater_rating = rater_rating + rater_k * (actual_rater_score - expected_rater)
        new_rated_rating = rated_rating + rated_k * (actual_rated_score - expected_rated)
        
        # Ensure ratings don't go below 100 or above 3000
        new_rater_rating = max(100, min(3000, new_rater_rating))
        new_rated_rating = max(100, min(3000, new_rated_rating))
        
        return new_rater_rating, new_rated_rating
    
    def get_rating_impact(self, rating_given, is_match):
        """
        Get a description of how the rating will impact the Elo
        """
        if is_match:
            if rating_given >= 9:
                return "Exceptional match - Strong positive impact for both"
            elif rating_given >= 8:
                return "Great match - Strong positive impact"
            elif rating_given >= 7:
                return "Good match - Positive impact"
            elif rating_given >= 6:
                return "Decent match - Moderate positive impact"
            else:
                return "Low-rated match - Slight positive impact"
        else:
            if rating_given <= 2:
                return "Very poor rating - Significant negative impact"
            elif rating_given <= 4:
                return "Poor rating - Negative impact"
            elif rating_given == 5:
                return "Average rating - Neutral impact"
            elif rating_given <= 7:
                return "Good rating - Slight positive impact"
            else:
                return "Great rating despite no match - Positive impact"
    
    def get_attractiveness_tier(self, elo_rating):
        """
        Get attractiveness tier based on Elo rating
        """
        if elo_rating >= 2000:
            return "Elite"
        elif elo_rating >= 1700:
            return "Very Attractive"
        elif elo_rating >= 1400:
            return "Attractive"
        elif elo_rating >= 1100:
            return "Average"
        elif elo_rating >= 800:
            return "Below Average"
        else:
            return "Low"

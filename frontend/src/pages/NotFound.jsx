import { Box, Button, Container, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          p: { xs: 2, sm: 3 }
        }}
      >
        <Typography 
          variant={isMobile ? "h2" : "h1"} 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '4rem', sm: '6rem' },
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          404
        </Typography>
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          component="h2" 
          gutterBottom
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Oops! Page Not Found
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: '400px' }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          size={isMobile ? "medium" : "large"}
          sx={{ 
            mt: 2,
            px: { xs: 3, sm: 4 },
            py: { xs: 1, sm: 1.5 }
          }}
        >
          Go to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
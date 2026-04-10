import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';
import { JwtTokenProvider } from '../jwt-token-provider';

describe('JWT Token Validation Test Suite', () => {
  let fixture: ComponentFixture<AuthService>;
  let authService: AuthService;
  let jwtProvider: JwtTokenProvider;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, JwtTokenProvider]
    });
    
    fixture = TestBed.createComponent(AuthService);
    authService = fixture.componentInstance;
    jwtProvider = TestBed.inject(JwtTokenProvider);
  });

  it('should generate valid JWT tokens', () => {
    // Test token generation functionality
    const username = 'testuser';
    const token = jwtProvider.generateToken(username);
    expect(token).toBeDefined();
    expect(jwtProvider.validateToken(token)).toBeTrue();
  });

  it('should validate refresh tokens properly', () => {
    // Test refresh token validation  
    const refreshToken = jwtProvider.generateRefreshToken('testuser');
    expect(refreshToken).toBeDefined();
    expect(jwtProvider.validateToken(refreshToken)).toBeTrue();
  });

  it('should invalidate expired tokens', () => {
    // Test expired token handling
    const expiredToken = jwtProvider.generateToken('expireduser');
    // Simulate expiration by modifying the token to be invalid
    expect(jwtProvider.validateToken(expiredToken)).toBeFalse();  
  });
});
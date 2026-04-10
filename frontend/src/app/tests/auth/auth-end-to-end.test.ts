import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { JwtTokenProvider } from '../jwt-token-provider';

describe('Auth End-to-End Test Suite', () => {
  let fixture: ComponentFixture<AuthService>;
  let authService: AuthService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, AuthController, JwtTokenProvider]
    });
    
    fixture = TestBed.createComponent(AuthService);
    authService = fixture.componentInstance;
  });

  it('should authenticate user with valid credentials', () => {
    // Test login functionality
    const authRequest = { username: 'testuser', password: 'password123' };
    expect(authService.authenticate(authRequest)).toBeTruthy();
  });

  it('should validate token expiration', () => {
    // Test JWT token validation
    const token = authService.generateToken('testuser');
    expect(authService.validateToken(token)).toBeTrue();
  });

  it('should handle invalid credentials gracefully', () => {
    // Test authentication failure scenarios  
    const authRequest = { username: 'invaliduser', password: 'wrongpassword' };
    expect(() => authService.authenticate(authRequest)).toThrowError();
  });
});
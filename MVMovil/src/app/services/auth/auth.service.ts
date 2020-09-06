import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { Platform, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import URL_SERVICIOS from 'src/app/config/config';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN = 'refresh_token'
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user: Observable<any>;

  authenticationState = new BehaviorSubject(false);
  

  constructor(
    private storage: Storage,
    private http: HttpClient,
    private plataform: Platform,
    private helper: JwtHelperService
  ) {
    this.plataform.ready().then(
      () => {
        this.checkToken();
      }
    )
  }

  checkToken(){
    this.storage.get(TOKEN_KEY).then(
      token => {
        if(token){
          let decoded = this.helper.decodeToken(token);
          let isExpired = this.helper.isTokenExpired(token);
          console.log('expired',isExpired)
          if(!isExpired){
            this.user = decoded;
            this.authenticationState.next(true);
          }
          else{
            this.storage.remove(TOKEN_KEY);
          }
        }
      }
    )
  };

  // refresh_toke(){
  //   this.http
  // }

  login(credentials){
    let url = URL_SERVICIOS.token;
    return this.http.post(url, credentials).pipe(
      tap(
        resp => {
          if(resp['access'] && resp['refresh']){
            this.storage.set(TOKEN_KEY, resp['access'])
            this.storage.set(REFRESH_TOKEN, resp['refresh'])
            this.authenticationState.next(true);
          }
        }
      ),
      catchError(e => {
        console.log(e.error.msg);
        throw new Error(e);
      })
    )
  };

  register(credentials){
    let url = URL_SERVICIOS.users;
    return this.http.post(url, credentials, {observe: 'response'}).pipe(
      tap(resp =>{
        console.log(resp);
      }),
      catchError(e => {
        console.log(e.error.msg);
        throw new Error(e);
      })
    );
  }

  async logout(){
    await this.storage.remove(TOKEN_KEY).then(
      () => {
        this.authenticationState.next(false);
        this.storage.remove(REFRESH_TOKEN).then();
      }
    )
  };

  isAuthenticated(){
    return this.authenticationState.value;
  };

  crearUsuarioFB(usuario){
    let url = URL_SERVICIOS.fblogin;
    return this.http.post(url, usuario).pipe(
      tap(
        resp => {
          this.storage.set(TOKEN_KEY, resp['access'])
          this.storage.set(REFRESH_TOKEN, resp['refresh'])
          this.authenticationState.next(true);
        }
      )
    )
  }

  
  getInfoUsuario(url){
    return this.http.get(url);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface CitationDepthResponse {
  found: boolean;
  depth?: number;
}

interface ClassificationResponse {
  classification: string | null;
}

interface AuthorPapersResponse {
  papers: string[];
}

@Injectable({
  providedIn: 'root'
})
export class Neo4jService {
  constructor(private http: HttpClient) {}

  async checkCitation(paperA: string, paperB: string): Promise<CitationDepthResponse> {
    return firstValueFrom(
      this.http.post<CitationDepthResponse>('/api/citation-depth', {
        paperA,
        paperB,
      }),
    );
  }

  async getClassification(paperTitle: string): Promise<ClassificationResponse> {
    return firstValueFrom(
      this.http.post<ClassificationResponse>('/api/classification', {
        paperTitle,
      }),
    );
  }

  async getAuthorPapers(authorName: string): Promise<AuthorPapersResponse> {
    return firstValueFrom(
      this.http.post<AuthorPapersResponse>('/api/author-papers', {
        authorName,
      }),
    );
  }
}
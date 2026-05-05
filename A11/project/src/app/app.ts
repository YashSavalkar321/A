import { Component } from '@angular/core';
import { Neo4jService } from './neo4j.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html', 
  styleUrls: ['./app.css']
})
export class App {  // <--- Changed to match your module imports
  queryA_Result: string = '';
  queryB_Result: string = '';
  queryC_Result: string[] = [];
  loadingA = false;
  loadingB = false;
  loadingC = false;

  constructor(private neo4jService: Neo4jService) {}

  async checkCitation(paperA: string, paperB: string) {
    this.loadingA = true;
    this.queryA_Result = '';
    try {
      const result = await this.neo4jService.checkCitation(paperA, paperB);
      if (result.found && typeof result.depth === 'number') {
        this.queryA_Result = `Yes! Paper A cites Paper B through ${result.depth} level(s).`;
      } else {
        this.queryA_Result = "No, there is no citation path between these papers.";
      }
    } catch (e) {
      this.queryA_Result = "Error executing query. Check console for details.";
      console.error(e);
    } finally {
      this.loadingA = false;
    }
  }

  async getClassification(paperTitle: string) {
    this.loadingB = true;
    this.queryB_Result = '';
    try {
      const result = await this.neo4jService.getClassification(paperTitle);
      if (result.classification) {
        this.queryB_Result = `Classification: ${result.classification}`;
      } else {
        this.queryB_Result = "Paper not found or has no classification.";
      }
    } catch (e) {
      this.queryB_Result = "Error executing query. Check console for details.";
      console.error(e);
    } finally {
      this.loadingB = false;
    }
  }

  async getAuthorPapers(authorName: string) {
    this.loadingC = true;
    this.queryC_Result = [];
    try {
      const result = await this.neo4jService.getAuthorPapers(authorName);
      this.queryC_Result = result.papers;
      if (this.queryC_Result.length === 0) {
        this.queryC_Result = ["No papers found for this author."];
      }
    } catch (e) {
      this.queryC_Result = ["Error executing query. Check console for details."];
      console.error(e);
    } finally {
      this.loadingC = false;
    }
  }
}